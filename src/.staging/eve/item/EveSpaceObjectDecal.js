import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSpaceObjectDecal
 * @implements EveObjectItem
 *
 * @parameter {Tw2Effect} decalEffect  -
 * @parameter {TypedArray} indexBuffer -
 * @parameter {vec3} position          -
 * @parameter {quat} rotation          -
 * @parameter {vec3} scaling           -
 */
export default class EveSpaceObjectDecal extends Tw2StagingClass
{

    decalEffect = null;
    indexBuffer = [];
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

Tw2StagingClass.define(EveSpaceObjectDecal, Type =>
{
    return {
        type: "EveSpaceObjectDecal",
        category: "EveObjectItem",
        props: {
            decalEffect: ["Tw2Effect"],
            indexBuffer: Type.TYPED,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING
        }
    };
});

