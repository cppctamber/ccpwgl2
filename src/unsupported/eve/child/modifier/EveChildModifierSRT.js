import { meta } from "utils";
import { vec3, quat, mat4 } from "math";
import { EveChildModifier } from "./EveChildModifier";


@meta.type("EveChildModifierSRT")
@meta.define({
    wgl: "EveChildModifierSRT",
    ccp: true
})
export class EveChildModifierSRT extends EveChildModifier
{

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    /**
     * Composes this modifier's SRT onto a transform.
     *
     * Carbon `EveChildModifierSRT::ApplyTransform`
     * (`TransformModifiers/EveChildModifierSRT.cpp:17-20`):
     *
     *     return TransformationMatrix( m_scaling, m_rotation, m_translation ) * transform;
     *
     * It COMPOSES, and it is an `ApplyTransform` modifier - so Carbon applies it
     * to the WORLD transform, after the local one has been built.
     *
     * This was a `Modify` that OVERWROTE `parent.localTransform` with its own SRT,
     * which threw away the child's authored translation, rotation and scaling
     * instead of stacking on top of them. That is why the 3D hangar adverts came
     * out at the wrong scale: `3d_complex/*_hangar` places an `EveChildMesh`
     * through one of these, and the container's own scaling was being discarded.
     *
     * Row-vector `SRT * transform` is `multiply(out, transform, SRT)` in
     * gl-matrix's column-vector convention - the operands swap.
     *
     * @param {mat4} transform - modified in place
     * @returns {mat4} transform
     */
    ApplyTransform(transform)
    {
        const srt = mat4.fromRotationTranslationScale(
            EveChildModifierSRT.global.mat4_0,
            this.rotation,
            this.translation,
            this.scaling
        );

        return mat4.multiply(transform, transform, srt);
    }

}
