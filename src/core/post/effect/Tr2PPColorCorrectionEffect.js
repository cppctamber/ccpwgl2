import { meta } from "utils";
import { vec3 } from "math";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Colour correction applied inside the composite, before the tone curve
 *
 * The order the composite applies these is fixed and not the declaration order:
 * white balance, saturation, contrast, gamma, then gain and offset.
 *
 * Every default here is an identity, and the white balance branch is skipped
 * entirely unless `whiteTemperature` differs from 6500 or `whiteTint` from 0 —
 * so an attached but untouched effect costs a permutation and changes nothing.
 *
 * @ccp Tr2PPColorCorrectionEffect
 */
@meta.type("Tr2PPColorCorrectionEffect")
@meta.ccp.define("Tr2PPColorCorrectionEffect")
export class Tr2PPColorCorrectionEffect extends Tr2PPEffect
{

    @meta.float
    whiteTemperature = 6500;

    @meta.float
    whiteTint = 0;

    @meta.float
    colorSaturation = 1;

    @meta.float
    colorContrast = 1;

    @meta.float
    colorGamma = 1;

    @meta.vector3
    colorGain = vec3.fromValues(1, 1, 1);

    @meta.vector3
    colorOffset = vec3.create();

}
