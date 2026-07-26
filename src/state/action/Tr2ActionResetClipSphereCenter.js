import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionResetClipSphereCenter")
@meta.ccp.define("Tr2ActionResetClipSphereCenter")
export class Tr2ActionResetClipSphereCenter extends Tw2Action
{
    static OBJECT_CENTER = 0;
    static LAST_DAMAGELOCATOR_HIT = 1;
    static CUSTOM = 2;

    @meta.string
    locatorSetName = "";

    @meta.int32
    locatorIndex = -1;

    @meta.uint
    resetBehavior = 0;

    Start(controller)
    {
        const owner = controller && controller.GetOwner ? controller.GetOwner() : null;
        if (!owner)
        {
            return false;
        }

        switch (this.resetBehavior)
        {
            case this.constructor.LAST_DAMAGELOCATOR_HIT:
                return this.ResetClipSphereToLocator(owner, "damage", owner.GetLastDamageLocatorHit ? owner.GetLastDamageLocatorHit() : -1);

            case this.constructor.CUSTOM:
                return this.ResetClipSphereToLocator(owner, this.locatorSetName, this.locatorIndex);

            case this.constructor.OBJECT_CENTER:
            default:
                if (owner.ResetClipSphereCenter)
                {
                    owner.ResetClipSphereCenter();
                    return true;
                }
                return false;
        }
    }

    ResetClipSphereToLocator(owner, locatorSetName, locatorIndex)
    {
        if (!owner)
        {
            return false;
        }

        if (owner.ResetClipSphereToLocator)
        {
            owner.ResetClipSphereToLocator(locatorSetName, locatorIndex);
            return true;
        }

        const locators = owner.GetLocatorsForSet ? owner.GetLocatorsForSet(locatorSetName) : null;
        if (locators && locators.length)
        {
            const index = locatorIndex < 0 ? Math.floor(Math.random() * locators.length) : locatorIndex;
            const locator = locators[index];
            if (locator && owner.ResetClipSphereCenterToPos)
            {
                owner.ResetClipSphereCenterToPos(locator.position);
                return true;
            }
        }

        return false;
    }
}

