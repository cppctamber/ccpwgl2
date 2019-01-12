import {quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveSpaceObjectDecal
 * @implements EveObjectItem
 *
 * @property {Tr2Effect} decalEffect  -
 * @property {TypedArray} indexBuffer -
 * @property {vec3} position          -
 * @property {quat} rotation          -
 * @property {vec3} scaling           -
 */
export default class EveSpaceObjectDecal extends Tw2BaseClass
{

    decalEffect = null;
    indexBuffer = [];
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

Tw2BaseClass.define(EveSpaceObjectDecal, Type =>
{
    return {
        isStaging: true,
        type: "EveSpaceObjectDecal",
        category: "EveObjectItem",
        props: {
            decalEffect: ["Tr2Effect"],
            indexBuffer: Type.TYPED,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING
        }
    };
});

