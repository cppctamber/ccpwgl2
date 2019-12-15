import { meta, vec4 } from "global";


@meta.type("EveSOFDataBoosterShape")
export class EveSOFDataBoosterShape
{

    @meta.black.color
    color = vec4.create();

    @meta.black.vector4
    noiseAmplitureEnd = vec4.create();

    @meta.black.vector4
    noiseAmplitureStart = vec4.create();

    @meta.black.vector4
    noiseFrequency = vec4.create();

    @meta.black.float
    noiseFunction = 0;

    @meta.black.float
    noiseSpeed = 0;

}
