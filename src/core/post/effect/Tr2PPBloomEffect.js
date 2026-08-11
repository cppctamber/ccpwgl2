import { meta } from "utils";
import { vec4 } from "math";
import { Tr2PPEffect } from "./Tr2PPEffect";


/**
 * Six-step bloom, composited into the image before the tone curve
 *
 * Carbon stores the sizes and tints as `m_stepSizes[6]` / `m_stepTints[6]` but
 * Blue exposes them individually as `step1Size`..`step6Size` and
 * `step1Tint`..`step6Tint`, which is how they hydrate.
 *
 * The bloom result is run through the tone curve on its own and normalised by
 * the white point BEFORE being added to the scene, rather than being composited
 * and tone-mapped together with it.
 *
 * `grimePath` doubles as the disable: with no bloom effect at all Carbon still
 * binds a black grime texture, so the composite's grime term is always live.
 *
 * @ccp Tr2PPBloomEffect
 */
@meta.type("Tr2PPBloomEffect")
@meta.ccp.define("Tr2PPBloomEffect")
export class Tr2PPBloomEffect extends Tr2PPEffect
{

    @meta.float
    luminanceThreshold = -1;

    @meta.float
    luminanceScale = 0.5;

    @meta.float
    brightness = 0.2;

    @meta.boolean
    exposureDependency = false;

    @meta.float
    grimeWeight = 0;

    @meta.path
    grimePath = "res:/texture/global/black.dds";

    @meta.uint
    steps = 6;

    @meta.float
    sizeScale = 4;

    @meta.float
    directionalWeight = 0;

    @meta.float
    step1Size = 0.3;

    @meta.float
    step2Size = 1;

    @meta.float
    step3Size = 2;

    @meta.float
    step4Size = 10;

    @meta.float
    step5Size = 30;

    @meta.float
    step6Size = 64;

    @meta.color
    step1Tint = vec4.fromValues(0.3465, 0.3465, 0.3465, 0.3465);

    @meta.color
    step2Tint = vec4.fromValues(0.138, 0.138, 0.138, 0.138);

    @meta.color
    step3Tint = vec4.fromValues(0.1176, 0.1176, 0.1176, 0.1176);

    @meta.color
    step4Tint = vec4.fromValues(0.066, 0.066, 0.066, 0.066);

    @meta.color
    step5Tint = vec4.fromValues(0.066, 0.066, 0.066, 0.066);

    @meta.color
    step6Tint = vec4.fromValues(0.061, 0.061, 0.061, 0.061);

}
