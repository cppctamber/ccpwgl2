import { meta } from "utils";
import { ResolveBindingPath } from "../controller";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionPlayMeshAnimation")
@meta.ccp.define("Tr2ActionPlayMeshAnimation")
export class Tr2ActionPlayMeshAnimation extends Tw2Action
{

    static PLAY = 0;
    static ENQUEUE_PLAY = 1;
    static STOP = 0;
    static ENQUEUE_STOP = 1;
    static NONE = 2;
    static OWNER = 0;
    static CHILD = 1;

    @meta.string
    animation = "";

    @meta.string
    mask = "";

    @meta.uint
    playAction = Tr2ActionPlayMeshAnimation.ENQUEUE_PLAY;

    @meta.uint
    stopAction = Tr2ActionPlayMeshAnimation.ENQUEUE_STOP;

    @meta.int32
    loops = -1;

    @meta.float
    delay = 0;

    @meta.float
    speed = 1;

    @meta.uint
    destinationType = Tr2ActionPlayMeshAnimation.OWNER;

    @meta.string
    path = "";

    @meta.notOwned
    @meta.struct()
    destination = null;

    @meta.boolean
    delayBinding = false;

    _controller = null;

    _boundDestination = null;

    _pendingDelay = 0;

    _pendingAnimationController = null;

    Link(controller)
    {
        this._controller = controller || null;
        if (!this.HasDelayedBinding())
        {
            this.LinkDestination(controller);
        }
    }

    Unlink()
    {
        this._controller = null;
        this._boundDestination = null;
        this._pendingDelay = 0;
        this._pendingAnimationController = null;
    }

    HasDelayedBinding()
    {
        return !!(this.delayBinding && this.path);
    }

    LinkDestination(controller)
    {
        if (this.destinationType === Tr2ActionPlayMeshAnimation.OWNER)
        {
            this._boundDestination = null;
            return true;
        }

        this._boundDestination = this.destination || this.ResolveDestinationPath(controller);
        return !!this._boundDestination;
    }

    ResolveDestinationPath(controller = this._controller)
    {
        if (!this.path || !controller)
        {
            return null;
        }

        if (controller.GetBindingPathRoots)
        {
            return ResolveBindingPath(this.path, controller.GetBindingPathRoots()) || null;
        }

        if (controller.GetBindingRoots)
        {
            const roots = controller.GetBindingRoots();
            return ResolveBindingPath(this.path, Object.keys(roots).map(key => [ key, roots[key] ])) || null;
        }

        return null;
    }

    IsBindingValid()
    {
        return this.destinationType === Tr2ActionPlayMeshAnimation.OWNER || !!this.GetDestination();
    }

    GetDestination(controller = this._controller, owner)
    {
        if (this.destinationType === Tr2ActionPlayMeshAnimation.OWNER)
        {
            return owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        }

        if (!this._boundDestination)
        {
            this.LinkDestination(controller);
        }

        return this._boundDestination || this.destination || null;
    }

    Start(controller, owner)
    {
        if (!this.animation)
        {
            return false;
        }

        this._controller = controller || this._controller;

        if (this.HasDelayedBinding())
        {
            this.LinkDestination(controller);
        }

        const animationController = this.GetAnimationController(controller, owner);
        if (!animationController)
        {
            return false;
        }

        // Cancel any previously pending delayed play
        this._pendingDelay = 0;
        this._pendingAnimationController = null;

        if (this.delay > 0 && controller && controller.RegisterUpdateable)
        {
            this._pendingDelay = this.delay;
            this._pendingAnimationController = animationController;
            controller.RegisterUpdateable(this);
            return true;
        }

        return this.Play(animationController);
    }

    /**
     * Per frame update, used only while a delayed play is pending
     * @param {Number} dt
     * @param {*} controller
     */
    Update(dt, controller = this._controller)
    {
        if (this._pendingDelay <= 0)
        {
            if (controller && controller.UnRegisterUpdateable)
            {
                controller.UnRegisterUpdateable(this);
            }
            return;
        }

        this._pendingDelay -= dt;
        if (this._pendingDelay <= 0)
        {
            const animationController = this._pendingAnimationController;
            this._pendingDelay = 0;
            this._pendingAnimationController = null;

            if (controller && controller.UnRegisterUpdateable)
            {
                controller.UnRegisterUpdateable(this);
            }

            if (animationController)
            {
                this.Play(animationController);
            }
        }
    }

    Stop(controller, owner)
    {
        // Cancel any pending delayed play
        this._pendingDelay = 0;
        this._pendingAnimationController = null;
        if (controller && controller.UnRegisterUpdateable)
        {
            controller.UnRegisterUpdateable(this);
        }

        if (!this.animation || this.stopAction === Tr2ActionPlayMeshAnimation.NONE)
        {
            return false;
        }

        const animationController = this.GetAnimationController(controller, owner);
        if (!animationController)
        {
            return false;
        }

        if (this.stopAction === Tr2ActionPlayMeshAnimation.ENQUEUE_STOP && animationController.GetAnimation)
        {
            const animation = animationController.GetAnimation(this.animation);
            if (animation && animation.IsPlaying && animation.IsPlaying())
            {
                // Let the current pass finish, then stop naturally
                animation.cycle = false;
                return true;
            }
        }

        if (animationController.StopAnimation)
        {
            animationController.StopAnimation(this.animation);
            return true;
        }

        return false;
    }

    /**
     * Plays the configured animation on a Tw2AnimationController
     * @param {Tw2AnimationController} animationController
     * @returns {Boolean}
     */
    Play(animationController)
    {
        if (!animationController || !animationController.PlayAnimation)
        {
            return false;
        }

        // PlayAnimation internally queues the command if the
        // controller's geometry/animations haven't loaded yet
        animationController.PlayAnimation(this.animation, this.GetPlayOptions());
        return true;
    }

    /**
     * Builds Tw2Animation.Play options from the action's serialized fields
     * @returns {{cycle: Boolean, timeScale: Number, callback: (Function|undefined)}}
     */
    GetPlayOptions()
    {
        const options = {
            cycle: this.loops !== 1,
            timeScale: this.speed,
            // Routes masked/layered playback (e.g. "TrackMaskStance") through the animation
            // controller; empty/unknown masks fall back to full-body playback.
            mask: this.mask
        };

        // Tw2Animation only supports play-once or infinite cycling, so a
        // finite loop count is implemented by disabling cycling once the
        // second to last pass has completed (the "cycle" event fires each
        // time a full pass completes)
        if (this.loops > 1)
        {
            let remaining = this.loops - 1;
            options.callback = animation =>
            {
                if (animation.IsFinished())
                {
                    return true;
                }

                remaining--;
                if (remaining <= 0)
                {
                    animation.cycle = false;
                    return true;
                }

                return false;
            };
        }

        return options;
    }

    /**
     * Resolves the destination's Tw2AnimationController
     * @param {*} controller
     * @param {*} [owner]
     * @returns {Tw2AnimationController|null}
     */
    GetAnimationController(controller, owner)
    {
        const destination = this.GetDestination(controller, owner);
        if (!destination)
        {
            return null;
        }

        if (destination.GetAnimationController)
        {
            return destination.GetAnimationController();
        }

        // EveShip2/EveSpaceObject expose their Tw2AnimationController as "animation"
        if (destination.animation && destination.animation.PlayAnimation)
        {
            return destination.animation;
        }

        if (destination.animationController && destination.animationController.PlayAnimation)
        {
            return destination.animationController;
        }

        // The destination may be an animation controller itself
        if (destination.PlayAnimation && destination.GetAnimation)
        {
            return destination;
        }

        return null;
    }

}
