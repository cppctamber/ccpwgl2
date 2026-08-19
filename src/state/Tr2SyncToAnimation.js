import { meta } from "utils";


/**
 * State finalizer: holds a state machine in its current state until the named
 * animation layer has finished playing.
 *
 * Carbon (`Controllers/Finalizers/Tr2SyncToAnimation.cpp:10-29`) asks a Granny
 * animation layer for its remaining time:
 * `GetAnimationController()->GetAnimationLayer(mask)->GetAnimationRemainingTime() <= 0`.
 * ccpwgl has no layer objects - its animation controller tracks playing clips by
 * track mask - so the same question is asked as
 * `!IsMaskAnimationPlaying(mask)`, which `EveShip2.IsAnimationPlaying` already
 * exposes to back the `IsAnimationPlaying("<layer>")` expression builtin. Carbon
 * computes that builtin from the very same remaining-time query
 * (`Controllers/Tr2ControllerExpression.cpp:103-122`), so the two agree; only
 * the route differs.
 *
 * That route matters: before 2026-08-19 this class asked for the Carbon shape
 * only, and no ccpwgl object provides it - `EveShip2` has no
 * `GetAnimationController` and its controller has no `GetAnimationLayer` - so
 * every guard below fell through and the finalizer permanently answered "yes,
 * transition". States authored to wait for their animation did not wait. The
 * Carbon-shaped path is kept last for hosts that do supply layers.
 *
 * Every hop stays presence-checked, because Carbon fails OPEN at each missing
 * step: an unresolvable animation must never block a state machine.
 */
@meta.type("Tr2SyncToAnimation")
@meta.ccp.define("Tr2SyncToAnimation")
export class Tr2SyncToAnimation extends meta.Model
{

    @meta.string
    mask = "";

    /**
     * Kill switch for the whole finalizer, for bisecting a live scene: set it
     * false and every state that would be held is released instead, which is
     * how this class behaved before 2026-08-19.
     * @type {Boolean}
     */
    static ENABLED = true;

    /**
     * Checks whether the state may leave yet.
     * @param {Tr2Controller} controller
     * @returns {Boolean} true when the animation has finished, or cannot be found
     */
    CanTransition(controller)
    {
        if (!Tr2SyncToAnimation.ENABLED) return true;

        const owner = controller && controller.GetOwner ? controller.GetOwner() : controller && controller.owner;
        if (!owner) return true;

        // An EMPTY mask fails open. Carbon's empty mask means the base layer
        // (`Tr2GrannyAnimation.cpp:303-317` returns `&m_baseLayer` for null) and
        // it asks that one layer for its remaining time. ccpwgl's
        // `IsMaskAnimationPlaying("")` answers a different question - whether ANY
        // animation with no track mask is playing - and a hull's looping idle
        // animation answers yes forever. Gating on that held every state with
        // this finalizer, with its actions already stopped, which stopped VFX
        // engine-wide on 2026-08-19.
        //
        // Only a NAMED mask gates, where the question and the answer line up.
        if (!this.mask) return true;

        // ccpwgl's own answer, and the one every space object actually has.
        if (owner.IsAnimationPlaying)
        {
            return !owner.IsAnimationPlaying(this.mask);
        }

        const animationController = owner.GetAnimationController
            ? owner.GetAnimationController()
            : owner.animation || owner.animationController;

        if (animationController && animationController.IsMaskAnimationPlaying)
        {
            return !animationController.IsMaskAnimationPlaying(this.mask || "");
        }

        // Carbon-shaped layer query, for hosts that supply Granny layers.
        if (!animationController || !animationController.GetAnimationLayer)
        {
            return true;
        }

        const layer = animationController.GetAnimationLayer(this.mask || null);
        if (!layer || !layer.GetAnimationRemainingTime)
        {
            return true;
        }

        return layer.GetAnimationRemainingTime() <= 0;
    }

}
