import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { mat4, vec3, quat } from "math";


let scratch = null;

function getScratch()
{
    if (!scratch)
    {
        scratch = {
            sourceRotation: quat.create(),
            sourceTranslation: vec3.create(),
            sourceScale: vec3.create(),
            diff: vec3.create(),
            dir: vec3.create(),
            mid: vec3.create(),
            scale: vec3.create(),
            arcMat: mat4.create(),
            arcRotation: quat.create(),
            srt: mat4.create(),
            rotationMatrix: mat4.create()
        };
    }
    return scratch;
}

/**
 * EveChildModifierStretch
 *
 * Source: carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/
 * EveChildModifierStretch.h/.cpp; persisted properties from
 * EveChildModifierStretch_Blue.cpp's ExposeToBlue() (1 property: "dest").
 */
@meta.notImplemented
@meta.type("EveChildModifierStretch")
@meta.define({
    wgl: "EveChildModifierStretch",
    ccp: true
})
export class EveChildModifierStretch extends EveChildModifier
{

    // Carbon: ITriVectorFunctionPtr m_dest (an animated/expression-driven
    // world-space target position, EveChildModifierStretch.h:23). ccpwgl has
    // no ITriVectorFunction/curve-evaluator runtime yet, so this is left
    // unimplemented - `destPosition` (Carbon's `SetDestPosition`, .h:20,
    // runtime-only / not persisted) is used verbatim as the stretch target
    // in the meantime, matching Carbon's own fallback of using
    // `m_destPosition` when `m_dest` is null (Stretch.cpp:38-41).
    @meta.notImplemented
    @meta.struct()
    dest = null;

    @meta.vector3
    destPosition = vec3.create();

    /**
     * Applies this modifier's transform, mutating `transform` in place
     *
     * Reproduces `EveChildModifierStretch::ApplyTransform`
     * (EveChildModifierStretch.cpp:26-51): stretches the child along the
     * direction from its own position to `destPosition` (e.g. a projectile
     * tracer stretched towards its impact point), keeping its original X/Y
     * scale but replacing Z scale with the distance to the target, then
     * re-applies the transform's original rotation on top. Carbon composes
     * matrices with row-vector `A * B` (B applied first); `mat4.multiply(out,
     * A, B)` mirrors that order directly (see
     * EveChildModifierTransformCommon.js header note).
     * @param {mat4} transform
     * @returns {mat4}
     */
    ApplyTransform(transform)
    {
        const {
            sourceRotation, sourceTranslation, sourceScale,
            diff, dir, mid, scale,
            arcMat, arcRotation, srt, rotationMatrix
        } = getScratch();

        mat4.decompose(transform, sourceRotation, sourceTranslation, sourceScale);

        const start = sourceTranslation;
        const end = this.destPosition;

        vec3.subtract(diff, end, start);
        vec3.normalize(dir, diff);

        mat4.arcFromForward(arcMat, dir);
        mat4.getRotation(arcRotation, arcMat);

        const length = vec3.length(diff);
        vec3.set(scale, sourceScale[0], sourceScale[1], length);

        vec3.scale(mid, diff, 0.5);
        vec3.add(mid, start, mid);

        mat4.fromRotationTranslationScale(srt, arcRotation, mid, scale);
        mat4.fromQuat(rotationMatrix, sourceRotation);

        mat4.multiply(transform, rotationMatrix, srt);
        return transform;
    }

}
