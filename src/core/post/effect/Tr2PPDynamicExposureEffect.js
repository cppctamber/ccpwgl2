import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Automatic exposure driven by a luminance histogram
 *
 * NOT IMPLEMENTABLE AS CARBON DOES IT. Carbon builds, merges and measures the
 * histogram in compute shaders, and WebGL2 has no compute stage. The class
 * exists so shipped data hydrates without loss and so the composite can be told
 * the effect is absent, which is a supported configuration in Carbon.
 *
 * With the effect absent the composite still applies `ExposureAdjust`, so this
 * is a degradation to fixed exposure rather than to none.
 *
 * Any replacement — a mip-chain luminance reduction, say — is a different
 * algorithm with different behaviour and must not be described as parity.
 *
 * @ccp Tr2PPDynamicExposureEffect
 */
@meta.type("Tr2PPDynamicExposureEffect")
@meta.ccp.define("Tr2PPDynamicExposureEffect")
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
