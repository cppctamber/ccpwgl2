import { meta } from "utils";
import { vec4 } from "math";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * A flat colour faded over the image
 *
 * Applied early — after exposure, before colour correction and the tone curve —
 * so the fade colour is graded along with everything else rather than laid on
 * top of the finished frame.
 *
 * The composite declares a `FADE_TOGGLE` axis, but Carbon's renderer never sets
 * it — `ApplyFade` only uploads parameters, expressing an absent effect as
 * `FadeAmount` 0 and leaving the option at its default. Do not infer from the
 * axis list that the option is driven.
 *
 * @ccp Tr2PPFadeEffect
 */
@meta.type("Tr2PPFadeEffect")
@meta.ccp.define("Tr2PPFadeEffect")
export class Tr2PPFadeEffect extends Tr2PPEffect
{

    @meta.color
    color = vec4.create();

    @meta.float
    intensity = 0;

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display && this.intensity > 0;
    }

}
