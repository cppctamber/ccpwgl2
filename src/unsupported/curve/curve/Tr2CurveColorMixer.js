import { meta } from "utils";
import { Tw2ColorCurve } from "curve";
import { vec4 } from "math";


@meta.type("Tr2CurveColorMixer")
export class Tr2CurveColorMixer extends Tw2ColorCurve
{

    @meta.color
    color1 = vec4.fromValues(0,0,0,1);

    @meta.color
    color2 = vec4.fromValues(0,0,0,1);

    @meta.float
    brightness = 0;

    @meta.color
    currentValue = vec4.fromValues(0,0,0,1);

    @meta.float
    saturation = 0.0;

    @meta.float
    lerpValue = 0.0;

}