import { meta } from "utils";
import { mat4 } from "math";


@meta.type("Tw2Bone")
export class Tw2Bone
{

    @meta.uint
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

}
