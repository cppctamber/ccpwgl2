import { meta } from "utils";
import { vec4 } from "math";


@meta.type("EveSOFDataBoosterShape")
export class EveSOFDataBoosterShape
{

    @meta.color
    color = vec4.create();

    @meta.vector4
    noiseAmplitureEnd = vec4.create();

    @meta.vector4
    noiseAmplitureStart = vec4.create();

    @meta.vector4
    noiseFrequency = vec4.create();

    @meta.float
    noiseFunction = 0;

    @meta.float
    noiseSpeed = 0;

    /**
     * Alias for noiseAmplitureEnd
     * @returns {vec4}
     */
    get noiseAmplitudeEnd()
    {
        return this.noiseAmplitureEnd;
    }

    /**
     * Alias for noiseAmplitureStart
     * @returns {vec4}
     */
    get noiseAmplitudeStart()
    {
        return this.noiseAmplitureStart;
    }

}
