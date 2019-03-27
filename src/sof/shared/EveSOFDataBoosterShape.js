import {vec4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataBoosterShape
 *
 * @property {vec4} color               -
 * @property {vec4} noiseAmplitureEnd   -
 * @property {vec4} noiseAmplitureStart -
 * @property {vec4} noiseFrequency      -
 * @property {Number} noiseFunction     -
 * @property {Number} noiseSpeed        -
 */
export class EveSOFDataBoosterShape extends EveSOFBaseClass
{

    color = vec4.create();
    noiseAmplitureEnd = vec4.create();
    noiseAmplitureStart = vec4.create();
    noiseFrequency = vec4.create();
    noiseFunction = 0;
    noiseSpeed = 0;

}

EveSOFDataBoosterShape.define(r =>
{
    return {
        type: "EveSOFDataBoosterShape",
        black: [
            ["color", r.vector4],
            ["noiseFunction", r.float],
            ["noiseSpeed", r.float],
            ["noiseAmplitureStart", r.vector4],
            ["noiseAmplitureEnd", r.vector4],
            ["noiseFrequency", r.vector4]
        ]
    };
});