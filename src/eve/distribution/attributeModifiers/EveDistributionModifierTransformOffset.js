// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionAttributeModifiers/EveDistributionModifierTransformOffset.h
import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.type("EveDistributionModifierTransformOffset")
@meta.ccp.define("EveDistributionModifierTransformOffset")
export class EveDistributionModifierTransformOffset extends meta.Model
{

    /** m_rotationCurve (ITriQuaternionFunctionPtr) [READWRITE, PERSIST] */
    @meta.struct("ITriQuaternionFunction")
    rotationCurve = null;

    /** m_translation (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    translation = vec3.create();

    /** m_rotation (Quaternion) [READWRITE, PERSIST] */
    @meta.quaternion
    rotation = quat.create();

    /** m_scale (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    /** m_scaleCurve (ITriVectorFunctionPtr) [READWRITE, PERSIST] */
    @meta.struct("ITriVectorFunction")
    scaleCurve = null;

    /** m_translationCurve (ITriVectorFunctionPtr) [READWRITE, PERSIST] */
    @meta.struct("ITriVectorFunction")
    translationCurve = null;

    /**
     * Always reports a transform effect, which puts the distribution into its
     * per-frame reset-and-reaccumulate mode.
     */
    AffectsTransform()
    {
        return true;
    }

    /**
     * Accumulates a translation, rotation and scale onto a placement's additional transform, taken from the authored constants or, when a curve is set, sampled from it at the placement's lifetime; the translation is rotated into the placement's current orientation and the scale multiplies the existing additional scale rather than replacing it.
     *
     * @returns {number} Always DO_NOTHING; this modifier never ends an entity's life.
     */
    ProcessDistributionModifier(placement, _deltaTime, _params)
    {
        // Carbon (row-vector): initialRotation * additionalRotation - initial first.
        const combinedRotation = quat.multiply(quat.create(), placement.additionalRotation, placement.initialRotation);
        const translation = vec3.create();
        if (this.translationCurve)
        {
            this.translationCurve.GetValueAt(placement.lifeTime, translation);
        }
        else
        {
            vec3.copy(translation, this.translation);
        }
        vec3.transformQuat(translation, translation, combinedRotation);
        vec3.add(placement.additionalTranslation, placement.additionalTranslation, translation);

        const rotation = quat.create();
        if (this.rotationCurve)
        {
            this.rotationCurve.GetValueAt(placement.lifeTime, rotation);
        }
        else
        {
            quat.copy(rotation, this.rotation);
        }
        // Carbon (row-vector): additionalRotation *= rotation - additional first.
        quat.multiply(placement.additionalRotation, rotation, placement.additionalRotation);

        const scale = vec3.create();
        if (this.scaleCurve)
        {
            this.scaleCurve.GetValueAt(placement.lifeTime, scale);
        }
        else
        {
            vec3.copy(scale, this.scaling);
        }
        vec3.multiply(placement.additionalScale, placement.additionalScale, scale);
        return 0;
    }

}
