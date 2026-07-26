import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2SyncToAnimation")
@meta.ccp.define("Tr2SyncToAnimation")
export class Tr2SyncToAnimation extends meta.Model
{
    @meta.string
    mask = "";

    CanTransition(controller)
    {
        const
            owner = controller && controller.GetOwner ? controller.GetOwner() : controller && controller.owner,
            animationController = owner && owner.GetAnimationController ? owner.GetAnimationController() : owner && owner.animationController;

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
