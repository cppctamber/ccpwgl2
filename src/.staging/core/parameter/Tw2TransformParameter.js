import {quat} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2TransformParameter
 * @ccp TriTransformParameter
 * @implements Parameter
 *
 * @parameter {quat} rotation -
 */
export default class Tw2TransformParameter extends Tw2StagingClass
{

    rotation = quat.create();

}

Tw2StagingClass.define(Tw2TransformParameter, Type =>
{
    return {
        type: "Tw2TransformParameter",
        category: "Parameter",
        props: {
            rotation: Type.TR_ROTATION
        }
    };
});

