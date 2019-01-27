import {mat4, quat, vec3} from "../../global";
import {EveChild} from "./EveChild";


/**
 * EveChildCloud
 * TODO: Implement
 * @ccp EveChildCloud
 *
 * @property {Number} cellScreenSize      -
 * @property {Tr2Effect} effect           -
 * @property {Number} preTesselationLevel -
 * @property {quat} rotation              -
 * @property {vec3} scaling               -
 * @property {Number} sortingModifier     -
 * @property {vec3} translation           -
 */
export class EveChildCloud extends EveChild
{
    // ccp
    cellScreenSize = 0;
    effect = null;
    preTesselationLevel = 0;
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sortingModifier = 0;
    translation = vec3.create();

}

EveChild.define(EveChildCloud, Type =>
{
    return {
        isStaging: true,
        type: "EveChildCloud",
        props: {
            cellScreenSize: Type.NUMBER,
            effect: ["Tw2Effect"],
            preTesselationLevel: Type.NUMBER,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            sortingModifier: Type.NUMBER,
            translation: Type.TR_TRANSLATION
        },
        notImplemented: ["*"]
    };
});

