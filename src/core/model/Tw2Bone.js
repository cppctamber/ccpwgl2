import { meta, mat4 } from "global";


@meta.type("Tw2Bone")
export class Tw2Bone
{

    @meta.objectOf("Tw2GeometryBone")
    boneRes = null;

    @meta.listOf("Tw2BoneBinding")
    bindingArrays = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.matrix4
    worldTransform = mat4.create();

    @meta.matrix4
    offsetTransform = mat4.create();

}
