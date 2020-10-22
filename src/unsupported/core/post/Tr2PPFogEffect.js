import { meta } from "utils";
import { vec3, vec4 } from "math";


@meta.notImplemented
@meta.type("Tr2PPFogEffect")
export class Tr2PPFogEffect
{

    @meta.vector3
    areaCenter = vec3.create();

    @meta.float
    blendAmount0 = 0;

    @meta.float
    blendAmount1 = 0;

    @meta.float
    blendAmount2 = 0;

    @meta.float
    blendBias0 = 0;

    @meta.float
    blendBias1 = 0;

    @meta.float
    blendBias2 = 0;

    @meta.float
    blendDistance0 = 0;

    @meta.float
    blendDistance1 = 0;

    @meta.float
    blendDistance2 = 0;

    @meta.float
    blendPower0 = 0;

    @meta.float
    blendPower1 = 0;

    @meta.float
    blendPower2 = 0;

    @meta.color
    color = vec4.create();

    @meta.float
    colorInfluence = 0;

    @meta.float
    nebulaInfluence = 0;

}
