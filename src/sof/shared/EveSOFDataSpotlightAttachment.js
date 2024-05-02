import { meta } from "utils";
import { vec3 } from "math";


@meta.type("EveSOFDataSpotlightAttachment")
export class EveSOFDataSpotlightAttachment extends meta.Model
{

    @meta.float
    intensity = 0.0;

    @meta.float
    innerAngleMultiplier = 0.0;

    @meta.float
    innerScaleMultiplier = 0.0;

    @meta.float
    outerScaleMultiplier = 0.0;

    @meta.float
    outerAngleMultiplier = 0.0;

    @meta.vector3
    translation = vec3.create();

    @meta.float
    saturation = 0.0;

}
