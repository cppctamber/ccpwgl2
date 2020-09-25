import { meta, vec4 } from "global";


@meta.ctor("EveSOFDataBoosterShape")
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

}
