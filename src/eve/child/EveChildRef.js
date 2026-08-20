// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildRef.h
// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildRef.cpp
import { meta } from "utils";
import { resMan } from "global";
import { EveChildContainer } from "./EveChildContainer";


/**
 * An effect child that is not authored inline, but loaded from its own resource
 * and hung underneath this node's transform.
 *
 * This is how the station ad billboards arrive: `chjita`'s SOF build emits a
 * single `EveChildRef` at `effectChildren[0]` pointing at
 * `res:/dx9/model/hangar/caldari/chjita/effects/chjita_fx_01a.red`, and the
 * whole advert scene - 123 advert paths cycled by `Tr2ActionChildEffect` - lives
 * inside that file. Nothing below this class is billboard-specific; a ref is a
 * general indirection and other content uses it the same way.
 *
 * **It extends `EveChildContainer` on purpose.** Carbon's `EveChildRef`
 * (`EveChildRef.h:18-27`) multiple-inherits `EveChildTransform`,
 * `ITr2CurveSetOwner`, `IEveEffectChildrenOwner`, `ITr2SoundEmitterOwner` and
 * `EveEntity`, then hand-writes ~20 methods whose entire body is
 * `if (m_child) m_child->TheSameThing(...)`. JavaScript has no multiple
 * inheritance, and ccpwgl's `EveChildContainer` is already the flattened union
 * of those same interfaces - it holds a transform, curve sets, controllers,
 * controller-variable replay, inherit properties and lights, and it already
 * recurses every one of those into its `objects` list. So a ref is a container
 * whose `objects` happens to be filled by a load rather than by the file:
 * Carbon's twenty forwarding methods become zero lines here, and they cannot
 * drift out of sync with the container's, which hand-written copies would.
 *
 * The cost is that a ref also inherits container surface Carbon's ref does not
 * declare (`boneIndex`, `transformModifiers`, `fxAttributes`). Those are inert
 * on ref data - the fields are simply absent from the file - and that is the
 * cheaper side of the trade.
 */
@meta.type("EveChildRef", true)
@meta.define({
    wgl: "EveChildRef",
    ccp: true
})
@meta.stage(2)
export class EveChildRef extends EveChildContainer
{

    @meta.path
    resPath = "";

    @meta.boolean
    loadChildAutomatically = true;

    /**
     * The loaded child. Also present as the sole entry of the inherited
     * `objects` list, which is what every inherited traversal actually walks;
     * this field exists because Carbon declares it (`EveChildRef.h:104`) and
     * callers reach for `ref.child`.
     * @type {?EveChild}
     */
    @meta.struct()
    child = null;

    /** Guards against a stale in-flight load overwriting a newer one. */
    _loadToken = 0;

    /**
     * The last faction colour set handed to this ref, replayed onto a child that
     * finishes loading afterwards. `EveChildInheritProperties` does not keep the
     * set it was given - it copies the individual colours out - so the ref has
     * to hold its own reference to replay it.
     * @type {?EveSOFDataFactionColorSet}
     */
    _pendingColorSet = null;

    /**
     * Loads the child, if automatic loading is enabled.
     *
     * Carbon `EveChildRef::Initialize` (cpp:50-58). Both ccpwgl readers call
     * `Initialize()` on an object once it has finished deserializing
     * (`Tw2ObjectReader.js:171`, `Tw2BlackPropertyReaders.js:210`), which is the
     * same point Carbon's blue construction reaches it, so the load starts as
     * soon as `resPath` is known.
     */
    Initialize()
    {
        super.Initialize();

        if (this.loadChildAutomatically && this.resPath)
        {
            this.LoadChild();
        }
    }

    /**
     * Sets the resource path, reloading the child when it changes and automatic
     * loading is enabled. Carbon `EveChildRef::SetResPath` (cpp:26-36) and the
     * `OnModified` handler that backs it (cpp:61-70).
     * @param {String} resPath
     */
    SetResPath(resPath)
    {
        if (this.resPath === resPath) return;
        this.resPath = resPath;
        if (this.loadChildAutomatically) this.LoadChild();
    }

    /**
     * Reloads the child.
     * @param {Boolean} [bypassAutoLoadBlocker] - loads even with automatic loading disabled
     * @returns {Boolean} true if a load was started
     */
    Reload(bypassAutoLoadBlocker)
    {
        if (!this.loadChildAutomatically && !bypassAutoLoadBlocker) return false;
        return this.LoadChild();
    }

    /**
     * Enables or disables automatic loading. Carbon `SetAutoLoadBlocker`
     * (cpp:45-48) takes the inverted sense, and is kept that way for parity.
     * @param {Boolean} shouldBlockAutoLoad
     */
    SetAutoLoadBlocker(shouldBlockAutoLoad)
    {
        this.loadChildAutomatically = !shouldBlockAutoLoad;
    }

    /**
     * Loads the child from `resPath`, replacing any child already present.
     *
     * Carbon `EveChildRef::LoadChild` (cpp:326-345) unregisters the old child
     * before loading, so a reload never leaves two children registered. The
     * equivalent here is emptying `objects`, since that list is what every
     * inherited traversal walks.
     *
     * @returns {Boolean} true if a load was started
     */
    LoadChild()
    {
        this.RemoveChild();

        if (!this.resPath) return false;

        const token = ++this._loadToken;

        resMan.GetObject(this.resPath, child =>
        {
            // A newer load, or a RemoveChild, happened while this was in flight
            if (token !== this._loadToken || !child) return;

            this.SetChild(child);
        });

        return true;
    }

    /**
     * Attaches an already constructed child.
     * @param {EveChild} child
     */
    SetChild(child)
    {
        this.RemoveChild();
        if (!child) return;

        this.child = child;
        this.objects.push(child);

        // A ref that loads after its parent has already resolved its faction
        // colours would otherwise never receive them, and a controller variable
        // set before the load would never reach the child's controllers.
        // Carbon has the same ordering problem and solves it the same way, by
        // replaying onto the child as it is registered (cpp:339-343).
        if (this._pendingColorSet && typeof child.SetInheritProperties === "function")
        {
            child.SetInheritProperties(this._pendingColorSet);
        }

        if (typeof child.SetControllerVariable === "function")
        {
            this.controllerVariables.forEach((value, name) => child.SetControllerVariable(name, value));
        }

        if (typeof child.StartControllers === "function") child.StartControllers();
    }

    /**
     * Detaches the current child, if any.
     * @returns {Boolean} true if a child was detached
     */
    RemoveChild()
    {
        if (!this.child) return false;

        const index = this.objects.indexOf(this.child);
        if (index !== -1) this.objects.splice(index, 1);
        this.child = null;
        return true;
    }

    /**
     * Starts this ref's controllers and the child's.
     * Carbon `EveChildRef::StartControllers` (cpp:292-298).
     */
    StartControllers()
    {
        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (controller && typeof controller.Start === "function") controller.Start();
        }

        if (this.child && typeof this.child.StartControllers === "function")
        {
            this.child.StartControllers();
        }
    }

    /**
     * Applies a resolved faction colour set to this ref and its child.
     * Recorded even when there is no child yet, so a child that finishes loading
     * later still receives it (see `SetChild`).
     * @param {EveSOFDataFactionColorSet} colorSet
     */
    SetInheritProperties(colorSet)
    {
        this._pendingColorSet = colorSet;
        super.SetInheritProperties(colorSet);
    }

}
