import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataBoosterShape
 *
 * @parameter {vec4} color               -
 * @parameter {vec4} noiseAmplitureEnd   -
 * @parameter {vec4} noiseAmplitureStart -
 * @parameter {vec4} noiseFrequency      -
 * @parameter {Number} noiseFunction     -
 * @parameter {Number} noiseSpeed        -
 */
export default class EveSOFDataBoosterShape extends Tw2StagingClass
{

    color = vec4.create();
    noiseAmplitureEnd = vec4.create();
    noiseAmplitureStart = vec4.create();
    noiseFrequency = vec4.create();
    noiseFunction = 0;
    noiseSpeed = 0;

}

Tw2StagingClass.define(EveSOFDataBoosterShape, Type =>
{
    return {
        type: "EveSOFDataBoosterShape",
        props: {
            color: Type.RGBA_LINEAR,
            noiseAmplitureEnd: Type.VECTOR4,
            noiseAmplitureStart: Type.VECTOR4,
            noiseFrequency: Type.VECTOR4,
            noiseFunction: Type.NUMBER,
            noiseSpeed: Type.NUMBER
        }
    };
});

