import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2Vector4Parameter
 * @ccp Tr2Vector4Parameter
 * @implements Parameter
 *
 * @parameter {vec4} value -
 */
export default class Tw2Vector4Parameter extends Tw2StagingClass
{

    value = vec4.create();

}

Tw2StagingClass.define(Tw2Vector4Parameter, Type =>
{
    return {
        type: "Tw2Vector4Parameter",
        category: "Parameter",
        props: {
            value: Type.VECTOR4
        }
    };
});

