// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildPlug.cpp
import { meta } from "utils";
import { EveChildContainer } from "./EveChildContainer";


/**
 * A separately-authored bundle of effect children and the controllers that drive
 * them, publishing a list of `Tr2ExternalParameter` as its tuning surface.
 *
 * **It is not an advert loader.** An earlier note in this repo recorded it as
 * "the advert-loader packaging, a state machine picking an advert by
 * `_startAdNumber`" - that conflated the class with the files it happens to be
 * stored in. A plug contains no state machine and no loading: its whole Blue
 * surface is `name`, `display`, `objects`, `externalParameters`, `controllers`
 * (`EveChildPlug_Blue.cpp:23-28`), and every Carbon method is a forward into
 * `m_objects`. The advert behaviour is real but belongs to `Tr2StateMachine` and
 * `Tr2ActionChildEffect`, both already implemented here - and the sibling file
 * `ad_loader_3d_complex_01a.black` runs the same state machine under a plain
 * `EveChildContainer` with no plug at all.
 *
 * Extends `EveChildContainer` for the reason set out on `EveChildRef`: the
 * container is already the flattened union of the interfaces Carbon's plug
 * multiple-inherits, and it already recurses `objects` for every traversal, so
 * roughly twenty-five Carbon forwarding methods become no lines at all.
 *
 * **A plug has no transform of its own.** `EveChildPlug_Blue.cpp` maps no
 * translation, rotation, scaling or localTransform, `UpdateAsyncronous` only
 * records the parent's transform (`cpp:232-248`), and `Setup` is deliberately an
 * EMPTY BODY (`cpp:355-357`) - the plug ignores SOF-supplied SRT on purpose,
 * because the socket that holds it owns the placement. The transform fields
 * inherited from the container stay at identity; nothing should write them.
 */
@meta.type("EveChildPlug")
@meta.define({
    wgl: "EveChildPlug",
    ccp: true
})
@meta.stage(2)
export class EveChildPlug extends EveChildContainer
{

    /**
     * This plug's published tuning surface. A socket binds its own parameter
     * values onto these by name.
     */
    @meta.list("Tr2ExternalParameter")
    externalParameters = [];

    /**
     * Carbon `AddExternalParameter` (`cpp:467-470`).
     * @param {Tr2ExternalParameter} parameter
     */
    AddExternalParameter(parameter)
    {
        if (parameter) this.externalParameters.push(parameter);
    }

    /**
     * Carbon `GetExternalParameters` (`cpp:472-475`).
     * @returns {Array<Tr2ExternalParameter>}
     */
    GetExternalParameters()
    {
        return this.externalParameters;
    }

    /**
     * Raises a controller event on this plug's OWN controllers.
     *
     * Carbon `HandleControllerEvent` (`cpp:406-412`) walks `m_controllers` and
     * nothing else - unlike `SetControllerVariable` two methods above it
     * (`cpp:385-404`), which also recurses into `m_objects`. That asymmetry is
     * deliberate and is preserved: an event fires the controllers attached here,
     * a variable propagates down.
     *
     * @param {String} name
     */
    HandleControllerEvent(name)
    {
        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (controller && controller.HandleEvent) controller.HandleEvent(name);
        }
    }

    /**
     * Starts this plug's own controllers. Carbon `StartControllers`
     * (`cpp:414-420`) - `m_controllers` only, same as the event above.
     */
    StartControllers()
    {
        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (controller && controller.Start) controller.Start();
        }
    }

    /**
     * Deliberately does nothing.
     *
     * Carbon `EveChildPlug::Setup` is an empty body (`cpp:355-357`): a plug
     * ignores the SRT a caller offers it, because its placement belongs to the
     * socket holding it. Overridden rather than inherited so that nothing
     * accidentally gives a plug a transform.
     *
     * @returns {null}
     */
    Setup()
    {
        return null;
    }

}
