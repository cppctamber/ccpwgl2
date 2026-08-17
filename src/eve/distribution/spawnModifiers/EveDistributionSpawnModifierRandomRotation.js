// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawnModifiers/EveDistributionSpawnModifierRandomRotation.h
import { meta } from "utils";
import { quat, vec3 } from "math";
import { createMinStdRandom, getDistributionSeed, setYawPitchRoll } from "../CjsDistributionRandom.js";


@meta.type("EveDistributionSpawnModifierRandomRotation")
@meta.ccp.define("EveDistributionSpawnModifierRandomRotation")
export class EveDistributionSpawnModifierRandomRotation extends meta.Model
{

    _timeSeed = Date.now() >>> 0;

    /** m_minRotation (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    minRotation = vec3.create();

    /** m_maxRotation (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    maxRotation = vec3.create();

    /** m_consistentRandom (bool) [READWRITE, PERSIST] */
    @meta.boolean
    consistentRandom = false;

    /** m_overrideRotation (bool) [READWRITE, PERSIST] */
    @meta.boolean
    overrideRotation = false;

    /**
     * Reseeds the random stream from the wall clock, so rotations differ between
     * runs unless consistentRandom pins them to the placement id.
     */
    Initialize()
    {
        this._timeSeed = Date.now() >>> 0;
        return true;
    }

    /**
     * Builds a rotation from random yaw, pitch and roll between minRotation and
     * maxRotation, then either replaces the placement's initial rotation or
     * combines it with the authored one.
     */
    ProcessSpawnModifier(placement, _numPlacements)
    {
        const seed = getDistributionSeed(placement.uniqueID, this._timeSeed, this.consistentRandom);
        const random = createMinStdRandom(seed);
        const euler = vec3.create();
        for (let axis = 0; axis < 3; axis++)
        {
            euler[axis] = this.minRotation[axis] + (this.maxRotation[axis] - this.minRotation[axis]) * random();
        }

        const rotation = setYawPitchRoll(quat.create(), euler[0], euler[1], euler[2]);
        if (this.overrideRotation)
        {
            placement.initialRotation.set(rotation);
        }
        else
        {
            // Carbon (row-vector): rotation * initialRotation - the random rotation
            // applies first.
            quat.multiply(placement.initialRotation, placement.initialRotation, rotation);
        }
    }

}
