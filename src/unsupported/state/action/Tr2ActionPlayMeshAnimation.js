import { meta } from "utils";
import { ResolveBindingPath } from "../controller";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
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

        if (this.HasDelayedBinding())
        {
            this.LinkDestination(controller);
        }

        const animationController = this.GetAnimationController(controller, owner);
        if (!animationController)
        {
            return false;
        }

        if (this.mask && animationController.AddAnimationLayerWithTrackMask)
        {
            animationController.AddAnimationLayerWithTrackMask(this.mask, this.mask);
        }

        const layerName = this.mask || null;
        const loops = Math.max(this.loops, 0);

        if (animationController.PlayLayerAnimationByName)
        {
            animationController.PlayLayerAnimationByName(
                layerName,
                this.animation,
                this.playAction === Tr2ActionPlayMeshAnimation.PLAY,
                loops,
                this.delay,
                this.speed,
                false
            );
            return true;
        }

        if (animationController.PlayAnimation)
        {
            animationController.PlayAnimation(this.animation, layerName, loops, this.delay, this.speed);
            return true;
        }

        return false;
    }

    Stop(controller, owner)
    {
        if (!this.animation || this.stopAction === Tr2ActionPlayMeshAnimation.NONE)
        {
            return false;
        }

        const animationController = this.GetAnimationController(controller, owner);
        if (!animationController)
        {
            return false;
        }

        const layer = animationController.GetAnimationLayer ? animationController.GetAnimationLayer(this.mask || null) : null;
        if (layer)
        {
            if (this.stopAction === Tr2ActionPlayMeshAnimation.STOP && layer.ClearAnimations)
            {
                layer.ClearAnimations();
                return true;
            }

            if (this.stopAction === Tr2ActionPlayMeshAnimation.ENQUEUE_STOP && layer.EndAnimation)
            {
                layer.EndAnimation();
                return true;
            }
        }

        if (animationController.StopAnimation)
        {
            animationController.StopAnimation(this.animation, this.mask || null, this.stopAction);
            return true;
        }

        return false;
    }

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

        return destination.animationController || null;
    }

}
