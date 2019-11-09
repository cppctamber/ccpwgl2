import { mat4 } from "global";

/**
 * Tw2Bone
 *
 * @property {Tw2GeometryBone} boneRes
 * @property {Array<Tw2BoneBinding>} bindingArrays
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} offsetTransform
 */
export class Tw2Bone
{

    boneRes = null;
    bindingArrays = [];
    localTransform = mat4.create();
    worldTransform = mat4.create();
    offsetTransform = mat4.create();

}
