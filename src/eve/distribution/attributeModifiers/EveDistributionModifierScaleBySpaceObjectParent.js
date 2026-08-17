// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionAttributeModifiers/EveDistributionModifierScaleBySpaceObjectParent.h
import { meta } from "utils";
import { sph3, vec3 } from "math";


@meta.type("EveDistributionModifierScaleBySpaceObjectParent")
@meta.ccp.define("EveDistributionModifierScaleBySpaceObjectParent")
export class EveDistributionModifierScaleBySpaceObjectParent extends meta.Model
{

    /** m_scaleFactor (float) [READWRITE, PERSIST] */
    @meta.float
    scaleFactor = 1;

    /** m_authoredForBoundingRadius (float) [READWRITE, PERSIST] */
    @meta.float
    authoredForBoundingRadius = 1000;

    /** m_scaleCurve (ITriVectorFunctionPtr) [READWRITE, PERSIST] */
    @meta.struct("ITriVectorFunction")
    scaleCurve = null;

    /** Reports a transform effect whenever a non-zero scale factor is authored. */
    AffectsTransform()
    {
        return this.scaleFactor !== 0;
    }

    /**
     * Scales a placement by the size of the parent space object: the parent's bounding-sphere radius either samples scaleCurve or, without a curve, forms a scaleFactor-shaped ratio against authoredForBoundingRadius, and the result multiplies into the placement's additional scale rather than replacing it. Does nothing when the update params carry no space-object parent.
     *
     * @returns {number} Always DO_NOTHING; this modifier never ends an entity's life.
     */
    ProcessDistributionModifier(placement, _deltaTime, params)
    {
        if (!params.spaceObjectParent)
        {
            return 0;
        }

        const bounds = sph3.create();
        params.spaceObjectParent.GetBoundingSphere(bounds);
        if (this.scaleCurve)
        {
            const finalScale = vec3.create();
            this.scaleCurve.GetValueAt(bounds[3], finalScale);
            vec3.multiply(placement.additionalScale, placement.additionalScale, finalScale);
        }
        else
        {
            const assetRatio = bounds[3] / Math.max(this.authoredForBoundingRadius, 1);
            const finalScale = assetRatio > 1
                ? 1 + this.scaleFactor * (assetRatio - 1)
                : Math.pow(assetRatio, this.scaleFactor);
            vec3.scale(placement.additionalScale, placement.additionalScale, finalScale);
        }
        return 0;
    }

}
