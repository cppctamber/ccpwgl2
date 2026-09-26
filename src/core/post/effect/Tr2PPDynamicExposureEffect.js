import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Automatic exposure driven by a luminance histogram
 *
 * Data only. `Tw2DynamicExposureRenderer` measures it, before the composite, in
 * place of Carbon's three compute passes: the same per-pixel 64-bin histogram
 * and the same MeasureExposure maths, built with a point scatter and a
 * fragment pass because WebGL2 has no compute stage.
 *
 * With the effect absent the composite still applies `ExposureAdjust`, so this
 * is a degradation to fixed exposure rather than to none - and 69 of the 168
 * shipped environment templates carry no dynamic exposure at all.
 *
 * A mip-chain luminance average would be a different algorithm with different
 * behaviour and must not be described as parity.
 *
 * @ccp Tr2PPDynamicExposureEffect
 */
@meta.define("Tr2PPDynamicExposureEffect", true)
export class Tr2PPDynamicExposureEffect extends Tr2PPEffect
{

    @meta.float
    influence = 1;

    @meta.float
    middleValue = 0.55;

    @meta.float
    adjustment = 0;

    @meta.float
    minExposure = -3.7;

    @meta.float
    maxExposure = 10;

    @meta.float
    minLuminance = 0.4649;

    @meta.float
    maxLuminance = 10;

    @meta.float
    minBrightness = 0.9;

    @meta.float
    maxBrightness = 0.98;

    @meta.float
    increaseSpeed = 2;

    @meta.float
    decreaseSpeed = 1.5;

    @meta.boolean
    debug = false;

}
