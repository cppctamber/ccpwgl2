import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2Vector4Parameter
 * @implements Parameter
 *
 * @parameter {vec4} value -
 */
export default class Tr2Vector4Parameter extends Tw2BaseClass
{

    value = vec4.create();

}

Tw2BaseClass.define(Tr2Vector4Parameter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2Vector4Parameter",
        category: "Parameter",
        props: {
            value: Type.VECTOR4
        }
    };
});

