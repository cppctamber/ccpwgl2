import { meta } from "utils";
import { tw2 } from "global";
import { Tr2PPEffect } from "./Tr2PPEffect";


const Shape = Object.freeze({
    DISK: 0,
    TRIANGLE: 1,
    RECTANGLE: 2,
    PENTAGON: 3,
    HEXAGON: 4,
    HEART: 5
});


/**
 * Depth of field, a separate bokeh chain rather than part of the composite
 *
 * Drawn by `Tw2DepthOfFieldRenderer`. 21 shipped assets populate it.
 *
 * Carbon gates this on a process-wide switch as well as the effect's own
 * scale (the `postprocessDofEnabled` setting in `tw2.settings`, off by default),
 * so a populated slot does not mean the effect runs - in Carbon or here.
 *
 * @ccp Tr2PPDepthOfFieldEffect
 */
@meta.define("Tr2PPDepthOfFieldEffect", true)
export class Tr2PPDepthOfFieldEffect extends Tr2PPEffect
{

    @meta.float
    scale = 0;

    @meta.float
    focalDistance = 0;

    @meta.float
    focalLength = 0;

    @meta.float
    cocScale = 1;

    @meta.enums(Shape)
    bokehShape = Shape.DISK;

    @meta.boolean
    foregroundBlurNeeded = true;

    @meta.boolean
    useTAAFriendlyBokeh = true;

    static Shape = Shape;

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        // Tr2PPDepthOfFieldEffect.cpp:25-28; the setting is registered at
        // Tr2PPDepthOfFieldEffect.cpp:7-8.
        return tw2.settings.GetValue("postprocessDofEnabled") && this.display && this.scale > 0;
    }

}
