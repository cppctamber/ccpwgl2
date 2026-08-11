import { meta } from "utils";
import { vec2, vec3, vec4 } from "math";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Environment fog, a separate two-effect pass rather than part of the composite
 *
 * NOT IMPLEMENTED. The class exists so shipped data hydrates without loss - 141
 * of the 177 environment templates populate this slot.
 *
 * The three blend bands (distance/bias/amount/power 0..2) are how the fog is
 * layered by range, and the area fields place it in world space, so the defaults
 * here are only meaningful as a shape - real values always come from content.
 *
 * @ccp Tr2PPFogEffect
 */
@meta.type("Tr2PPFogEffect")
@meta.ccp.define("Tr2PPFogEffect")
export class Tr2PPFogEffect extends Tr2PPEffect
{

    @meta.float
    intensity = 1;

    @meta.float
    totalAmount = 0;

    @meta.float
    totalPower = 1;

    @meta.float
    backgroundOcclusion = 1;

    @meta.float
    brightnessThreshold0 = 0;

    @meta.float
    brightnessThreshold1 = 0.5;

    @meta.float
    brightnessAdjustmentAmount = 1;

    @meta.float
    blendDistance0 = 2000;

    @meta.float
    blendBias0 = 0;

    @meta.float
    blendAmount0 = 0.2;

    @meta.float
    blendPower0 = 2;

    @meta.float
    blendDistance1 = 25000;

    @meta.float
    blendBias1 = 0.6;

    @meta.float
    blendAmount1 = 0.35;

    @meta.float
    blendPower1 = 1;

    @meta.float
    blendDistance2 = 120000;

    @meta.float
    blendBias2 = 1;

    @meta.float
    blendAmount2 = 0.5;

    @meta.float
    blendPower2 = 0.2;

    @meta.vector3
    areaSize = vec3.fromValues(69142.0859375, 13828.4169922, 66337.203125);

    @meta.vector2
    areaScale = vec2.fromValues(30, 20);

    @meta.vector3
    areaCenter = vec3.fromValues(-27042.2988281, -633.4446411, 11896.0957031);

    @meta.float
    colorInfluence = 0.125;

    @meta.color
    color = vec4.fromValues(1, 0.4235294, 0, 1);

    @meta.float
    nebulaInfluence = 0.5;

    @meta.float
    nebulaBlur = 7;

    @meta.float
    originalBrightenOnly = 0.5;

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display && this.intensity > 0;
    }

}
