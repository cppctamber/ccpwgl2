import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { mat4, vec3 } from "math";
import { Billboard2D, Billboard3D, DistanceBase } from "./EveChildModifierTransformCommon";


let scratch = null;

function getScratch()
{
    if (!scratch)
    {
        scratch = {
            scale: mat4.create(),
            invScale: mat4.create(),
            sansScale: mat4.create(),
            billboard: mat4.create(),
            alignMat: mat4.create(),
            d: vec3.create(),
            translation: vec3.create()
        };
    }
    return scratch;
}

/**
 * EveChildModifierBillboard3D
 *
 * Source: carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/
 * EveChildModifierBillboard3D.h/.cpp; persisted properties from
 * EveChildModifierBillboard3D_Blue.cpp's ExposeToBlue() (1 property: "fixed").
 */
@meta.notImplemented
@meta.type("EveChildModifierBillboard3D")
@meta.define({
    wgl: "EveChildModifierBillboard3D",
    ccp: true
})
export class EveChildModifierBillboard3D extends EveChildModifier
{

    @meta.boolean
    fixed = false;

    /**
     * Applies this modifier's transform, mutating `transform` in place
     *
     * Reproduces `EveChildModifierBillboard3D::ApplyTransform`
     * (EveChildModifierBillboard3D.cpp:17-39). Carbon composes matrices with
     * row-vector `A * B`, in which **A** is applied first; gl-matrix is
     * column-vector, so every composition swaps its operands and Carbon's
     * `A * B` becomes `mat4.multiply(out, B, A)` (see
     * EveChildModifierTransformCommon.js header note).
     * @param {mat4} transform
     * @returns {mat4}
     */
    ApplyTransform(transform)
    {
        const { scale, invScale, sansScale, billboard, alignMat, d, translation } = getScratch();

        if (this.fixed)
        {
            const scaleX = vec3.length(transform.subarray(0, 3));
            const scaleY = vec3.length(transform.subarray(4, 7));
            const scaleZ = vec3.length(transform.subarray(8, 11));

            mat4.fromScaling(scale, [ scaleX, scaleY, scaleZ ]);
            mat4.fromScaling(invScale, [
                scaleX !== 0 ? 1 / scaleX : 0,
                scaleY !== 0 ? 1 / scaleY : 0,
                scaleZ !== 0 ? 1 / scaleZ : 0
            ]);

            // Carbon (row-vector): invScale * transform - invScale first
            mat4.multiply(sansScale, transform, invScale);

            translation[0] = transform[12];
            translation[1] = transform[13];
            translation[2] = transform[14];
            Billboard3D(billboard, translation);

            // Carbon (row-vector): scale * billboard * transformSansScale - scale first
            mat4.multiply(transform, sansScale, billboard);
            mat4.multiply(transform, transform, scale);
            return transform;
        }

        Billboard2D(transform);
        DistanceBase(alignMat, d, transform);
        // Carbon (row-vector): alignMat * billboard - align first
        mat4.multiply(transform, transform, alignMat);
        return transform;
    }

}
