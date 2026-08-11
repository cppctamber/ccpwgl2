import { meta } from "utils";
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
 * NOT IMPLEMENTED. 21 shipped assets populate it.
 *
 * Note Carbon gates this on a process-wide switch as well as the effect's own
 * scale, so a populated slot does not mean the effect ran even in Carbon.
 *
 * @ccp Tr2PPDepthOfFieldEffect
 */
@meta.type("Tr2PPDepthOfFieldEffect")
@meta.ccp.define("Tr2PPDepthOfFieldEffect")
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
        return this.display && this.scale > 0;
    }

}
