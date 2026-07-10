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
            forward: vec3.create(),
            scalingTransform: mat4.create()
        };
    }
    return scratch;
}

/**
 * EveChildModifierHaloInverted
 *
 * Source: carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/
 * EveChildModifierHaloInverted.h/.cpp (no persisted properties;
 * EveChildModifierHaloInverted_Blue.cpp's ExposeToBlue() only maps the
 * interface). Note: despite the name, Carbon's `EveChildModifierHaloInverted`
 * is its own `IEveChildTransformModifier` implementation - it does not inherit
 * from `EveChildModifierHalo` (they're siblings with unrelated math), so this
 * extends `EveChildModifier` directly rather than `EveChildModifierHalo`.
 */
@meta.notImplemented
@meta.type("EveChildModifierHaloInverted")
@meta.define({
    wgl: "EveChildModifierHaloInverted",
    ccp: true
})
export class EveChildModifierHaloInverted extends EveChildModifier
{

    /**
     * Applies this modifier's transform, mutating `transform` in place
     *
     * Reproduces `EveChildModifierHaloInverted::ApplyTransform`
     * (EveChildModifierHaloInverted.cpp:17-38): scales the child down to zero
     * as its local Z axis turns to face the camera (i.e. the opposite of a
     * standard halo, which fades in when facing the camera), by dotting the
     * camera direction against the transform's *backward* axis. Carbon
     * composes matrices with row-vector `A * B` (B applied first);
     * `mat4.multiply(out, A, B)` mirrors that order directly (see
     * EveChildModifierTransformCommon.js header note).
     * @param {mat4} transform
     * @returns {mat4}
     */
    ApplyTransform(transform)
    {
        const { alignMat, d, forward, scalingTransform } = getScratch();

        // distCenter is likewise computed and left unused in Carbon's
        // ApplyTransform (HaloInverted.cpp:20-21).
        DistanceBase(alignMat, d, transform);

        vec3.set(forward, transform[8], transform[9], transform[10]);
        vec3.normalize(forward, forward);

        vec3.normalize(d, d);
        let scale = -vec3.dot(d, forward);
        if (scale < 0) scale = 0;

        mat4.fromScaling(scalingTransform, [ scale, scale, scale ]);

        mat4.multiply(transform, alignMat, transform);
        mat4.multiply(transform, scalingTransform, transform);
        return transform;
    }

}
