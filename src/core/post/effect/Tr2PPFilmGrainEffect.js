import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Film grain, applied after the composite rather than inside it
 *
 * NOT IMPLEMENTED. The class exists so shipped data hydrates without loss.
 * Carbon runs this as its own pass after tonemapping, so it cannot be folded
 * into the composite even once it is built.
 *
 * @ccp Tr2PPFilmGrainEffect
 */
@meta.type("Tr2PPFilmGrainEffect")
@meta.ccp.define("Tr2PPFilmGrainEffect")
export class Tr2PPFilmGrainEffect extends Tr2PPEffect
{

    @meta.float
    intensity = 0.0008;

    @meta.float
    grainSize = 1.25;

    @meta.float
    grainDensity = 0.35;

    @meta.float
    grainContrast = 4;

    @meta.float
    brightnessModifier = -3;

    @meta.boolean
    colored = true;

    @meta.float
    colorAmount = 0.6;

    /**
     * Identifies if the effect contributes anything
     * @returns {Boolean}
     */
    IsActive()
    {
        return this.display && this.intensity > 0;
    }

}
