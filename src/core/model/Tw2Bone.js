import { meta } from "utils";
import { mat3, mat4, quat, vec3 } from "math";


@meta.type("Tw2Bone")
@meta.wgl.define("Tw2Bone")
export class Tw2Bone
{

    @meta.int32
    index = -1;

    @meta.struct("Tw2GeometryBone")
    boneRes = null;

    @meta.list("Tw2BoneBinding")
    bindingArrays = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.matrix4
    worldTransform = mat4.create();

    @meta.matrix4
    offsetTransform = mat4.create();

    // Index of this bone within its model/skeleton (aligned with
    // Tw2GeometrySkeleton.trackMasks weight arrays). Set by Tw2AnimationController.AddModel.
    _skeletonIndex = -1;

    // Per-frame TRS accumulators used by Tw2AnimationController.Update to blend
    // multiple (optionally masked) animations before composing localTransform.
    _blendPosition = vec3.create();
    _blendRotation = quat.create();
    _blendScaleShear = mat3.create();

    /**
     * Gets the bone's parent bone index
     * @returns {Number}
     */
    GetParentBoneIndex()
    {
        return this.boneRes ? this.boneRes.parentIndex : -1;
    }

}
