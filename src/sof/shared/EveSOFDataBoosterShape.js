import { __get, meta } from "utils";
import { vec4 } from "math";


@meta.type("EveSOFDataBoosterShape")
export class EveSOFDataBoosterShape extends meta.Model
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

    /**
     *
     * @param {EveSOFDataBoosterShape} a
     * @param {EveSOFDataBoosterShape} b
     * @param {EveSOFDataBoosterShape} [out=new EveSOFDataBoosterShape]
     * @returns {EveSOFDataBoosterShape}
     */
    static combine(a, b, out)
    {
        out = out || new this();
        if (!a && !b) return out;
        if (!a) a = out;
        vec4.copy(out.color, __get(b, "color", a));
        vec4.copy(out.noiseAmplitureEnd, __get(b, "noiseAmplitureEnd", a));
        vec4.copy(out.noiseAmplitureStart, __get(b, "noiseAmplitureStart", a));
        vec4.copy(out.noiseFrequency, __get(b, "noiseFrequency", a));
        out.noiseFunction = __get(b, "noiseFunction", a);
        out.noiseSpeed = __get(b, "noiseSpeed", a);
        return out;
    }

}
