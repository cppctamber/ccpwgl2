// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildSocket.cpp
import { meta } from "utils";
import { resMan } from "global";
import { EveChildContainer } from "./EveChildContainer";


/**
 * An attachment point that loads exactly one `EveChildPlug` from a resource path
 * and places it.
 *
 * The socket owns the transform and the plug owns the content - that split is
 * the whole design. A plug has no serialised transform at all and its `Setup` is
 * an empty body in Carbon; the socket carries translation/rotation/scaling and
 * applies them in `UpdateAsyncronous` (`EveChildSocket.cpp:322-337`).
 *
 * Built on the same shape as `EveChildRef`, for the same reasons: extend
 * `EveChildContainer` so every traversal comes from its `objects` recursion, and
 * hold the loaded child in `objects` so it is actually walked. See that class for
 * the argument in full.
 *
 * **Not implemented: the socket parameter family.** Carbon's `m_parameters` are
 * `IEveSocketParameter` values that bind onto the plug's published
 * `Tr2ExternalParameter` list and are pushed into it every frame
 * (`cpp:53-183`, `cpp:304-320`). That needs nine concrete parameter classes and a
 * real `Tr2ExternalParameter` - which is presently a field-only shell with no
 * method bodies - and, on a scan of all 656 `.black` files under
 * `res:/dx9/model/shared/fx/`, NOTHING SHIPPED EXERCISES IT: the only sockets
 * found are fifteen hologram panel prefabs whose serialised keys are name,
 * translation, rotation, scaling, localTransform and objects, with no `resPath`,
 * no `plug` and no `parameters`. They are empty attachment points. So `parameters`
 * is carried for round-tripping and `Rebind` is a no-op until content needs it.
 * (Scan scope: `shared/fx` only - hangar, ship, station and scene not covered.)
 */
@meta.type("EveChildSocket")
@meta.define({
    wgl: "EveChildSocket",
    ccp: true
})
@meta.stage(2)
export class EveChildSocket extends EveChildContainer
{

    /**
     * Path to the plug. The serialised name is `resPath`, not `plugResPath`
     * (`EveChildSocket_Blue.cpp:24`).
     */
    @meta.path
    resPath = "";

    /**
     * The loaded plug, also held as the sole entry of the inherited `objects`
     * list - which is what every traversal actually walks. Carbon maps this
     * READ-only and never persists it (`_Blue.cpp:26`): it is always produced by
     * the load, never authored.
     * @type {?EveChildPlug}
     */
    @meta.struct("EveChildPlug")
    plug = null;

    /**
     * Socket-side override values for the plug's external parameters. Carried,
     * not applied - see the class comment.
     */
    @meta.notImplemented
    @meta.list()
    parameters = [];

    /** Guards a stale in-flight load against overwriting a newer one. */
    _loadToken = 0;

    /** Replayed onto a plug that finishes loading after the colours resolved. */
    _pendingColorSet = null;

    /**
     * Loads the plug.
     *
     * Carbon runs `LoadChild(); BindParameters(); Propogate();` in sequence
     * (`cpp:185-192`), which is only correct because its `LoadObject` is
     * SYNCHRONOUS (`cpp:486`). Here the load is a callback, so the bind has to
     * happen when the plug actually arrives, not on the next line.
     *
     * Both readers call `Initialize()` once an object finishes deserializing,
     * which is the point Carbon's blue construction reaches it.
     */
    Initialize()
    {
        super.Initialize();
        this.LoadChild();
        return true;
    }

    /**
     * Carbon `OnModified` (`cpp:194-205`): a `resPath` change reloads.
     */
    OnModified()
    {
        return true;
    }

    /**
     * Sets the plug path, reloading when it changes.
     * Carbon `SetPlugResPath` (`cpp:33-40`).
     * @param {String} resPath
     */
    SetPlugResPath(resPath)
    {
        if (this.resPath === resPath) return;
        this.resPath = resPath;
        this.LoadChild();
    }

    /**
     * @returns {String}
     */
    GetPlugResPath()
    {
        return this.resPath;
    }

    /**
     * Reloads the plug. Carbon `Reload` (`cpp:42-45`).
     * @returns {Boolean} true if a load was started
     */
    Reload()
    {
        return this.LoadChild();
    }

    /**
     * Loads the plug from `resPath`, replacing whatever is attached.
     * Carbon `LoadChild` (`cpp:479-497`) unregisters the old plug first, so a
     * reload never leaves two attached.
     * @returns {Boolean} true if a load was started
     */
    LoadChild()
    {
        this.RemovePlug();

        if (!this.resPath) return false;

        const token = ++this._loadToken;

        resMan.GetObject(this.resPath, plug =>
        {
            // A newer load, or a RemovePlug, happened while this was in flight
            if (token !== this._loadToken || !plug) return;
            this.SetPlug(plug);
        });

        return true;
    }

    /**
     * Attaches an already constructed plug and replays anything it missed.
     *
     * A plug arriving after its colours resolved, or after a controller variable
     * was set, would otherwise never receive either - the same ordering problem
     * `EveChildRef` solves the same way.
     *
     * @param {EveChildPlug} plug
     */
    SetPlug(plug)
    {
        this.RemovePlug();
        if (!plug) return;

        this.plug = plug;
        this.objects.push(plug);

        if (this._pendingColorSet && typeof plug.SetInheritProperties === "function")
        {
            plug.SetInheritProperties(this._pendingColorSet);
        }

        if (typeof plug.SetControllerVariable === "function")
        {
            this.controllerVariables.forEach((value, name) => plug.SetControllerVariable(name, value));
        }

        this.Rebind();

        if (typeof plug.StartControllers === "function") plug.StartControllers();
    }

    /**
     * Detaches the current plug, if any.
     * @returns {Boolean} true if one was detached
     */
    RemovePlug()
    {
        if (!this.plug) return false;

        const index = this.objects.indexOf(this.plug);
        if (index !== -1) this.objects.splice(index, 1);
        this.plug = null;
        return true;
    }

    /**
     * Binds this socket's parameter values onto the plug's external parameters.
     *
     * Carbon `BindParameters` (`cpp:142-172`), exposed to Blue as `Rebind`
     * (`_Blue.cpp:66-71`) - the internal name there is the misspelled
     * `Propogate`. A no-op until the socket parameter family exists; see the
     * class comment for why that is deferred rather than missing.
     *
     * @returns {Boolean} false - nothing was bound
     */
    @meta.notImplemented
    Rebind()
    {
        return false;
    }

    /**
     * Records the colour set for a plug that has not arrived yet, then cascades.
     * @param {EveSOFDataFactionColorSet} colorSet
     */
    SetInheritProperties(colorSet)
    {
        this._pendingColorSet = colorSet;
        super.SetInheritProperties(colorSet);
    }

    /**
     * Raises a controller event on the plug.
     * @param {String} name
     */
    HandleControllerEvent(name)
    {
        if (this.plug && this.plug.HandleControllerEvent) this.plug.HandleControllerEvent(name);
    }

    /**
     * Starts the plug's controllers.
     */
    StartControllers()
    {
        if (this.plug && this.plug.StartControllers) this.plug.StartControllers();
    }

    /**
     * Deliberately does nothing.
     *
     * Carbon's is an empty body (`cpp:248-250`): a socket's contents belong to
     * the plug it loaded, so nothing may be added to it at runtime. Inheriting
     * `EveChildContainer`'s working version would INVENT behaviour Carbon does
     * not have, which is why this is overridden rather than left alone.
     *
     * @returns {Boolean} false
     */
    AddToEffectChildrenList()
    {
        return false;
    }

    /**
     * Deliberately does nothing - Carbon's is empty (`cpp:252-254`). See
     * `AddToEffectChildrenList` above.
     * @returns {Boolean} false
     */
    RemoveFromEffectChildrenList()
    {
        return false;
    }

}
