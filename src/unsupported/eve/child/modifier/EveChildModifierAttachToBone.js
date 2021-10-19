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
        if (this.boneIndex >= 0)
        {
            const bones = perObjectData.vs.Get("JointMat");
            const boneMat4 = mat4.fromJointMatIndex(EveChildModifier.global.mat4_0, bones, this.boneIndex);
            mat4.multiply(parent.localTransform, boneMat4, parent.localTransform);
            return true;
        }
        return false;
    }

}
