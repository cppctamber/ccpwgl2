// Source: trinity/trinity/Eve/EveLODHelper.h
// Source: trinity/trinity/Eve/EveLODHelper.cpp
import { Tr2Lod } from "constant/ccpwgl";

/**
 * Carbon's stateless logical LOD helper.
 *
 * Geometry and texture selection deliberately remain outside this helper.
 */
export class EveLODHelper
{

    static lowUpdateRate = 1;

    static mediumUpdateRate = 0.1;

    /**
     * Checks whether a logical LOD is due for an update.
     * @param {Number} lod
     * @param {Number} timeSinceUpdate
     * @returns {Boolean}
     */
    static ShouldUpdate(lod, timeSinceUpdate)
    {
        switch (lod)
        {
            case Tr2Lod.TR2_LOD_UNSPECIFIED:
            case Tr2Lod.TR2_LOD_LOW:
                return timeSinceUpdate >= EveLODHelper.lowUpdateRate;

            case Tr2Lod.TR2_LOD_MEDIUM:
                return timeSinceUpdate >= EveLODHelper.mediumUpdateRate;

            default:
                return true;
        }
    }

    /**
     * Merges two logical LODs, or classifies and merges a visible sphere when
     * an update context is supplied.
     * @param {Number} lod0
     * @param {Number|Array} lodOrSphere
     * @param {EveUpdateContext} [updateContext]
     * @returns {Number}
     */
    static MergeLOD(lod0, lodOrSphere, updateContext)
    {
        if (updateContext)
        {
            const
                sphere = lodOrSphere,
                frustum = updateContext.GetFrustum();

            if (!frustum.IsSphereVisible(sphere, sphere[3]))
            {
                return Tr2Lod.TR2_LOD_UNSPECIFIED;
            }

            const estimatedSize = frustum.GetPixelSizeAcross(sphere, sphere[3]);
            let classifiedLod = Tr2Lod.TR2_LOD_LOW;

            if (estimatedSize >= updateContext.GetMediumDetailThreshold())
            {
                classifiedLod = Tr2Lod.TR2_LOD_HIGH;
            }
            else if (estimatedSize >= updateContext.GetLowDetailThreshold())
            {
                classifiedLod = Tr2Lod.TR2_LOD_MEDIUM;
            }

            return EveLODHelper.MergeLOD(lod0, classifiedLod);
        }

        const lod1 = lodOrSphere;

        if (lod0 === Tr2Lod.TR2_LOD_UNSPECIFIED || lod1 === Tr2Lod.TR2_LOD_UNSPECIFIED)
        {
            return lod0 === Tr2Lod.TR2_LOD_UNSPECIFIED ? lod1 : lod0;
        }

        return lod0 > lod1 ? lod0 : lod1;
    }

}
