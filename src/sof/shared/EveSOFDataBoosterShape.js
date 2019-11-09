import { vec4 } from "global";


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
export class EveSOFDataBoosterShape
{

    color = vec4.create();
    noiseAmplitureEnd = vec4.create();
    noiseAmplitureStart = vec4.create();
    noiseFrequency = vec4.create();
    noiseFunction = 0;
    noiseSpeed = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "color", r.vector4 ],
            [ "noiseFunction", r.float ],
            [ "noiseSpeed", r.float ],
            [ "noiseAmplitureStart", r.vector4 ],
            [ "noiseAmplitureEnd", r.vector4 ],
            [ "noiseFrequency", r.vector4 ]
        ];
    }
}
