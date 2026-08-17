// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawnModifiers/EveDistributionSpawnModifierRandomScale.h
import { meta } from "utils";
import { vec3 } from "math";
import { createMinStdRandom, getDistributionSeed } from "../CjsDistributionRandom.js";


@meta.type("EveDistributionSpawnModifierRandomScale")
@meta.ccp.define("EveDistributionSpawnModifierRandomScale")
export class EveDistributionSpawnModifierRandomScale extends meta.Model
{

    _timeSeed = Date.now() >>> 0;

    /** m_minScale (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    minScale = vec3.fromValues(1, 1, 1);

    /** m_maxScale (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    maxScale = vec3.fromValues(1, 1, 1);

    /** m_consistentRandom (bool) [READWRITE, PERSIST] */
    @meta.boolean
    consistentRandom = false;

    /** m_uniformScale (bool) [READWRITE, PERSIST] */
    @meta.boolean
    uniformScale = false;

    /** m_overrideScale (bool) [READWRITE, PERSIST] */
    @meta.boolean
    overrideScale = false;

    /**
     * Reseeds the random stream from the wall clock, so scales differ between runs
     * unless consistentRandom pins them to the placement id.
     */
    Initialize()
    {
        this._timeSeed = Date.now() >>> 0;
        return true;
    }

    /**
     * Draws a random scale between minScale and maxScale - per axis, or with one
     * shared factor when uniformScale is set - and either replaces the placement's
     * initial scale or multiplies into it.
     */
    ProcessSpawnModifier(placement, _numPlacements)
    {
        const seed = getDistributionSeed(placement.uniqueID, this._timeSeed, this.consistentRandom);
        const random = createMinStdRandom(seed);
        const scale = vec3.create();

        if (this.uniformScale)
        {
            vec3.lerp(scale, this.minScale, this.maxScale, random());
        }
        else
        {
            for (let axis = 0; axis < 3; axis++)
            {
                scale[axis] = this.minScale[axis] + (this.maxScale[axis] - this.minScale[axis]) * random();
            }
        }

        if (this.overrideScale)
        {
            placement.initialScale.set(scale);
        }
        else
        {
            vec3.multiply(placement.initialScale, placement.initialScale, scale);
        }
    }

}
