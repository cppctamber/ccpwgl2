import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { mat4 } from "math";


@meta.notImplemented
@meta.type("EveChildModifierAttachToBone")
export class EveChildModifierAttachToBone extends EveChildModifier
{

    @meta.uint
    boneIndex = -1;

    /**
     * Modifies a transform
     * @param {EveChild} parent
     * @param {Tw2PerObjectData} perObjectData
     * @return {boolean|*}
     */
    Modify(parent, perObjectData)
    {
        if (this.boneIndex > -1 && parent.boneIndex !== this.boneIndex)
        {
            if (!parent._boneTransform) parent._boneTransform = mat4.create();
            const bones = perObjectData.vs.Get("JointMat");
            mat4.fromJointMatIndex(parent._boneTransform, bones, this.boneIndex);
            parent._hasBone = true;
        }
        return false;
    }

}
