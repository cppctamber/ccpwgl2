import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * A colour lookup table blended into the composite
 *
 * The composite takes up to FOUR of these, each with its own influence, and
 * divides the result by the summed influence. `Tr2PostProcess2` therefore holds
 * a `luts` list beside the legacy singular `lut`.
 *
 * The LUT is sampled AFTER the linear-to-sRGB encode, so it operates in display
 * space rather than scene-linear. Applying it anywhere else changes the result.
 *
 * @ccp Tr2PPLutEffect
 */
@meta.type("Tr2PPLutEffect")
@meta.ccp.define("Tr2PPLutEffect")
export class Tr2PPLutEffect extends Tr2PPEffect
{

    @meta.float
    influence = 0;

    @meta.path
    path = "res:/dx9/scene/postprocess/LUTdefault.dds";

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display && this.influence > 0;
    }

}
