import { meta } from "utils";
import { vec4 } from "math";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * God rays, a separate pass rather than part of the composite
 *
 * NOT IMPLEMENTED. The class exists so shipped data hydrates without loss - 147
 * of the 177 environment templates populate this slot, so a reader missing its
 * properties fails on most of them.
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
