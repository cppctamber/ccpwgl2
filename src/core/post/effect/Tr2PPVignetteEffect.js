import { meta } from "utils";
import { vec2, vec4 } from "math";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * A vignette blended over the graded image
 *
 * The composite samples a shape texture and two independently scrolling detail
 * samples, modulates them by a sine over time between `sineMinimum` and
 * `sineMaximum`, and blends the result toward `color`.
 *
 * Both `intensity` and `opacity` default to 0, so a freshly constructed effect
 * is inactive until either is raised.
 *
 * @ccp Tr2PPVignetteEffect
 */
@meta.type("Tr2PPVignetteEffect")
@meta.ccp.define("Tr2PPVignetteEffect")
export class Tr2PPVignetteEffect extends Tr2PPEffect
{

    @meta.float
    intensity = 0;

    @meta.float
    opacity = 0;

    @meta.color
    color = vec4.fromValues(1, 1, 1, 1);

    @meta.path
    shapePath = "res:/texture/global/black.dds";

    @meta.path
    detailPath = "res:/texture/global/white.dds";

    @meta.vector2
    detail1Size = vec2.fromValues(16, 16);

    @meta.vector2
    detail1Scroll = vec2.create();

    @meta.vector2
    detail2Size = vec2.fromValues(16, 16);

    @meta.vector2
    detail2Scroll = vec2.create();

    @meta.float
    sineFrequency = 1;

    @meta.float
    sineMinimum = 0;

    @meta.float
    sineMaximum = 1;

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display && this.intensity > 0 && this.opacity > 0;
    }

}
