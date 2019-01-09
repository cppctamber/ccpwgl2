import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2TranslationAdapter
 * @implements CurveAdapter
 *
 * @parameter {vec3} value -
 */
export default class Tr2TranslationAdapter extends Tw2BaseClass
{

    value = vec3.create();

}

Tw2BaseClass.define(Tr2TranslationAdapter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2TranslationAdapter",
        category: "CurveAdapter",
        props: {
            value: Type.VECTOR3
        }
    };
});

