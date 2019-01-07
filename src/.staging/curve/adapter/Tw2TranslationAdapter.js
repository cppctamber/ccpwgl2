import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2TranslationAdapter
 * @ccp Tr2TranslationAdapter
 * @implements CurveAdapter
 *
 * @parameter {vec3} value -
 */
export default class Tw2TranslationAdapter extends Tw2StagingClass
{

    value = vec3.create();

}

Tw2StagingClass.define(Tw2TranslationAdapter, Type =>
{
    return {
        type: "Tw2TranslationAdapter",
        category: "CurveAdapter",
        props: {
            value: Type.VECTOR3
        }
    };
});

