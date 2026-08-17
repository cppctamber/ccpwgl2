import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { mat4, vec3 } from "math";
import { DistanceBase } from "./EveChildModifierTransformCommon";


let scratch = null;

function getScratch()
{
    if (!scratch)
    {
        scratch = {
            alignMat: mat4.create(),
            d: vec3.create(),
            scalingTransform: mat4.create(),
            translationTransform: mat4.create()
        };
    }
    return scratch;
}

/**
 * EveChildModifierBooster
 *
 * Source: carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/
 * EveChildModifierBooster.h/.cpp (no persisted properties;
 * EveChildModifierBooster_Blue.cpp's ExposeToBlue() only maps the interface).
 */
@meta.notImplemented
@meta.type("EveChildModifierBooster")
@meta.define({
    wgl: "EveChildModifierBooster",
    ccp: true
})
export class EveChildModifierBooster extends EveChildModifier
{

    /**
     * Applies this modifier's transform, mutating `transform` in place
     *
     * Reproduces `EveChildModifierBooster::ApplyTransform`
     * (EveChildModifierBooster.cpp:16-31): scales a fixed-radius (0.5) sphere
     * so it keeps a constant apparent size as the camera distance changes,
     * then re-centers it so its near edge stays put. Carbon composes matrices
     * with row-vector `A * B`, in which **A** is applied first; gl-matrix is
     * column-vector, so every composition swaps its operands and Carbon's
     * `A * B` becomes `mat4.multiply(out, B, A)` (see
     * EveChildModifierTransformCommon.js header note).
     * @param {mat4} transform
     * @returns {mat4}
     */
    ApplyTransform(transform)
    {
        const { alignMat, d, scalingTransform, translationTransform } = getScratch();

        const distCenter = DistanceBase(alignMat, d, transform);

        const radius = 0.5;
        const B = Math.sqrt(distCenter * distCenter - radius * radius);
        const scale = B / distCenter;
        const trans = -(radius * radius) / (distCenter * scale);

        mat4.fromScaling(scalingTransform, [ scale, scale, scale ]);
        mat4.fromTranslation(translationTransform, [ 0, 0, trans ]);

        // Carbon (row-vector): scaling * align * translation applied in that order
        mat4.multiply(transform, transform, scalingTransform);
        mat4.multiply(transform, transform, alignMat);
        mat4.multiply(transform, transform, translationTransform);
        return transform;
    }

}
