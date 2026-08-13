import { meta } from "utils";
import { vec4 } from "math";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * God rays, a separate pass rather than part of the composite
 *
 * Drawn by {@link Tw2GodRaysRenderer}, which owns the three passes and the
 * targets - this class is data only, so it stays hydratable from a black file.
 * 147 of the 177 environment templates populate this slot.
 *
 * `grFactors` is deliberately absent: Carbon holds it as a hardcoded
 * `const Vector4` rather than serializing it, so the renderer supplies it.
 *
 * `intensity` defaults to 0 and `IsActive` requires it to be positive, so a
 * template that does not author an intensity draws nothing BY DESIGN. God rays
 * are also High-quality only - see the renderer's note on why they render black
 * rather than cheap at Medium.
 *
 * @ccp Tr2PPGodRaysEffect
 */
@meta.type("Tr2PPGodRaysEffect")
@meta.ccp.define("Tr2PPGodRaysEffect")
export class Tr2PPGodRaysEffect extends Tr2PPEffect
{

    @meta.float
    intensity = 0;

    @meta.color
    godRayColor = vec4.fromValues(1, 1, 1, 1);

    @meta.path
    noiseTexturePath = "res:/Texture/Global/noise.dds";

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display && this.intensity > 0;
    }

}
