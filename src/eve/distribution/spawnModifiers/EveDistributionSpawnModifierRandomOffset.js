// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawnModifiers/EveDistributionSpawnModifierRandomOffset.h
import { meta } from "utils";
import { vec3 } from "math";
import { createMinStdRandom, getDistributionSeed } from "../CjsDistributionRandom.js";


@meta.type("EveDistributionSpawnModifierRandomOffset")
@meta.ccp.define("EveDistributionSpawnModifierRandomOffset")
export class EveDistributionSpawnModifierRandomOffset extends meta.Model
{

    _timeSeed = Date.now() >>> 0;

    /** m_minOffset (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    minOffset = vec3.create();

    /** m_maxOffset (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    maxOffset = vec3.create();

    /** m_consistentRandom (bool) [READWRITE, PERSIST] */
    @meta.boolean
    consistentRandom = false;

    /** m_uniformOffset (bool) [READWRITE, PERSIST] */
    @meta.boolean
    uniformOffset = false;

    /**
     * Reseeds the random stream from the wall clock, so offsets differ between
     * runs unless consistentRandom pins them to the placement id.
     */
    Initialize()
    {
        this._timeSeed = Date.now() >>> 0;
        return true;
    }

    /**
     * Adds a random offset between minOffset and maxOffset - drawn per axis, or
     * with one shared factor when uniformOffset is set - to the placement's
     * initial translation, rotated into the placement's initial orientation first.
     */
    ProcessSpawnModifier(placement, _numPlacements)
    {
        const seed = getDistributionSeed(placement.uniqueID, this._timeSeed, this.consistentRandom);
        const random = createMinStdRandom(seed);
        const offset = vec3.create();

        if (this.uniformOffset)
        {
            vec3.lerp(offset, this.minOffset, this.maxOffset, random());
        }
        else
        {
            for (let axis = 0; axis < 3; axis++)
            {
                offset[axis] = this.minOffset[axis] + (this.maxOffset[axis] - this.minOffset[axis]) * random();
            }
        }

        vec3.transformQuat(offset, offset, placement.initialRotation);
        vec3.add(placement.initialTranslation, placement.initialTranslation, offset);
    }

}
