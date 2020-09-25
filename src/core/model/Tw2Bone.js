import { meta, mat4 } from "global";


@meta.ctor("Tw2Bone")
export class Tw2Bone
{

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

}
