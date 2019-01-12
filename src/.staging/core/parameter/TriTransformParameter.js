import {quat} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * TriTransformParameter
 * @implements Parameter
 *
 * @property {quat} rotation -
 */
export default class TriTransformParameter extends Tw2BaseClass
{

    rotation = quat.create();

}

Tw2BaseClass.define(TriTransformParameter, Type =>
{
    return {
        isStaging: true,
        type: "TriTransformParameter",
        category: "Parameter",
        props: {
            rotation: Type.TR_ROTATION
        }
    };
});

