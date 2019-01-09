import {quat} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * TriTransformParameter
 * @implements Parameter
 *
 * @parameter {quat} rotation -
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

