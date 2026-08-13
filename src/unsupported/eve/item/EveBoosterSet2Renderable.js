import { meta } from "utils";
import { quat, vec3, vec4, mat4, sph3 } from "math";
import { LodLevelPixels } from "constant/ccpwgl";


/**
 * One ship's instance of a booster set.
 *
 * Carbon keeps the authored placements on `EveBoosterSet2` and every piece of
 * per-frame state here, so N ships can share one set. This class carries the
 * parent transform, speed and rotation, derives the booster and trail
 * intensities, and maintains the five point trail spline that the volumetric
 * trail shader expands into a ribbon.
 *
 * Ported from `EveBoosterSet2.h` / `EveBoosterSet2.cpp` (`EveBoosterSet2Renderable`).
 */
@meta.type("EveBoosterSet2Renderable")
export class EveBoosterSet2Renderable extends meta.Model
{

    @meta.float
    trailIntensity = 0;

    @meta.float
    trailsTotalLength = 0;

    /**
     * These start true so a set whose owner never runs a lod pass still draws;
     * `UpdateLod` only ever narrows them.
     */
    @meta.boolean
    isVisible = true;

    @meta.boolean
    trailsVisible = true;

    @meta.boolean
    boostersVisible = true;

    @meta.float
    trailsTimeDelta = 1;

    @meta.boolean
    boosterHighLod = true;

    @meta.float
    overallIntensity = 0;

    @meta.quaternion
    parentRotation = quat.create();

    @meta.float
    parentSpeed = 0;

    /**
     * The floor the derived intensity is held above.
     *
     * Carbon has destiny, so a parked ship really does have its boosters off.
     * ccpwgl does not, and `EveShip2.boosterGain` is the value a caller already
     * uses to say how hard the boosters are burning - the same slot Carbon
     * fills with the averaged renderable intensity - so it is taken as a floor
     * rather than replacing the speed derived value, which may exceed it.
     */
    @meta.float
    intensityFloor = 0;

    _boosterSet = null;
    _lastAccFactor = 0;
    _lastValue = 0;
    _parentTransform = mat4.create();

    _trailsBoundsMin = vec3.fromValues(Infinity, Infinity, Infinity);
    _trailsBoundsMax = vec3.fromValues(-Infinity, -Infinity, -Infinity);

    _trailsControlPositions = Array.from({ length: CONTROL_POINT_COUNT }, () => vec3.create());
    _trailsControlNormals = Array.from({ length: CONTROL_POINT_COUNT }, () => vec3.fromValues(0, 0, -1));
    _trailsControlNormalsFactor = new Float32Array(CONTROL_POINT_COUNT).fill(1);
    _trailsSequenceLength = new Float32Array(CONTROL_POINT_COUNT);

    _trailsOffsets = Array.from({ length: POSITION_OFFSET_COUNT }, () => vec3.create());
    _trailsOffsetLatest = 0;
    _trailsOffsetAccu = vec3.create();
    _trailsTimeToNext = 0;

    /**
     * Binds this instance to the booster set whose authored placements, colours
     * and light data it draws
     * @param {EveBoosterSet2} boosterSet
     */
    SetBoosterSet(boosterSet)
    {
        this._boosterSet = boosterSet || null;
    }

    /**
     * Gets the parent transform reference
     *
     * Carbon reads `m_parentTransform` directly; the owning set needs it to
     * place each booster light, so it is exposed rather than copied.
     * @returns {mat4}
     */
    GetParentTransformReference()
    {
        return this._parentTransform;
    }

    /**
     * Derives the booster intensity from the parent's speed ratio and the
     * acceleration along its backward axis, each low pass filtered against the
     * previous frame and the result clamped to 2.
     *
     * An always on set returns its authored intensity instead.
     * @param {vec3} [acceleration]
     * @returns {Number}
     */
    CalculateIntensity(acceleration)
    {
        const boosterSet = this._boosterSet;
        if (!boosterSet) return 0;
        if (boosterSet.alwaysOn) return Math.max(boosterSet.alwaysOnIntensity, this.intensityFloor);

        const backward = vec3.transformQuat(vec3_0, Z_AXIS, this.parentRotation);
        const speedRatio = boosterSet.maxVel ? this.parentSpeed / boosterSet.maxVel : 0;

        let accFactor = vec3.dot(acceleration || ZERO, backward);
        accFactor *= Math.max(0.3, speedRatio);
        accFactor = Math.min(1, Math.max(0, accFactor));
        accFactor = accFactor * 0.2 + this._lastAccFactor * 0.8;
        this._lastAccFactor = accFactor;

        let value = this._lastValue * 0.8 + (0.8 * speedRatio + 0.2 * accFactor) * 0.2;
        value = Math.min(value, 2);
        this._lastValue = value;
        return Math.max(value, this.intensityFloor);
    }

    /**
     * Takes the parent transform, speed and rotation for the frame, deriving
     * speed from the transform delta when the set is not destiny driven, and
     * recomputes the overall intensity
     * @param {Number} dt
     * @param {mat4} parentTransform
     * @param {Number} [parentSpeed=0]
     * @param {vec3} [parentAcceleration]
     * @param {quat} [parentRotation]
     * @returns {Number} the overall intensity
     */
    Update(dt, parentTransform, parentSpeed = 0, parentAcceleration, parentRotation)
    {
        const boosterSet = this._boosterSet;

        if (boosterSet && boosterSet.destinyUpdate)
        {
            this.parentSpeed = Number(parentSpeed) || 0;
        }
        else if (dt && parentTransform)
        {
            const
                dx = parentTransform[12] - this._parentTransform[12],
                dy = parentTransform[13] - this._parentTransform[13],
                dz = parentTransform[14] - this._parentTransform[14];

            this.parentSpeed = Math.hypot(dx, dy, dz) / dt;
        }

        if (parentTransform) mat4.copy(this._parentTransform, parentTransform);
        if (parentRotation) quat.copy(this.parentRotation, parentRotation);

        this.overallIntensity = this.CalculateIntensity(parentAcceleration);
        return this.overallIntensity;
    }

    /**
     * Recomputes the trail spline and maps its total length onto the trail
     * intensity, fading in above the minimum length and back out approaching
     * the maximum, with nothing drawn outside that band
     * @param {Number} dt
     * @returns {Boolean}
     */
    UpdateTrails(dt)
    {
        const boosterSet = this._boosterSet;
        if (!boosterSet) return false;

        this.CalculateSplineData(dt);

        const length = this.trailsTotalLength;

        if (length > TRAIL_MIN_LENGTH && length < TRAIL_MIN_LENGTH + TRAIL_MIN_LENGTH_FADE)
        {
            this.trailIntensity = SinSmooth((length - TRAIL_MIN_LENGTH) / TRAIL_MIN_LENGTH_FADE);
        }
        else if (length > TRAIL_MAX_LENGTH - TRAIL_MAX_LENGTH_FADE && length < TRAIL_MAX_LENGTH)
        {
            this.trailIntensity = SinSmooth((TRAIL_MAX_LENGTH - length) / TRAIL_MAX_LENGTH_FADE);
        }
        else if (length < TRAIL_MIN_LENGTH || length > TRAIL_MAX_LENGTH)
        {
            this.trailIntensity = 0;
        }
        else
        {
            this.trailIntensity = 1;
        }

        if (boosterSet.alwaysOn) this.trailIntensity = 1;
        return true;
    }

    /**
     * Places the five trail control points for the frame, sampled out of the
     * physics offset ring at the trail time delta, or taken from the set's
     * static offsets rotated into parent space, then recomputes the spline
     * metrics
     * @param {Number} dt
     * @returns {Boolean} false for a non positive delta
     */
    CalculateSplineData(dt)
    {
        if (!(dt > 0)) return false;

        const
            boosterSet = this._boosterSet,
            parentPosition = vec3.set(vec3_parent, this._parentTransform[12], this._parentTransform[13], this._parentTransform[14]);

        if (boosterSet.physicsUpdate)
        {
            this.UpdatePhysicsTrailOffsets(dt);

            const stride = Math.trunc(this.trailsTimeDelta / POSITION_OFFSET_DELTA);
            let ringIndex = this._trailsOffsetLatest;

            for (let i = 0; i < CONTROL_POINT_COUNT; i++)
            {
                vec3.add(this._trailsControlPositions[i], parentPosition, this._trailsOffsets[ringIndex]);
                ringIndex = WrapOffsetIndex(ringIndex - stride);
            }
        }
        else
        {
            const offsets = boosterSet.trailsStaticOffsets;
            for (let i = 0; i < CONTROL_POINT_COUNT; i++)
            {
                TransformNormal(this._trailsControlPositions[i], offsets[i], this._parentTransform);
                vec3.add(this._trailsControlPositions[i], this._trailsControlPositions[i], parentPosition);
            }
        }

        this.UpdateSplineMetrics();
        return true;
    }

    /**
     * Advances the 300 entry trail offset ring by the parent's movement in
     * fixed ~16.7ms steps, taking a separate bulk path once twenty or more
     * steps are owed in a single frame so a stalled or teleported ship does
     * not walk the ring one entry at a time
     * @param {Number} dt
     */
    UpdatePhysicsTrailOffsets(dt)
    {
        const movement = vec3.transformQuat(vec3_0, Z_AXIS, this.parentRotation);
        vec3.scale(movement, movement, dt * this.parentSpeed);

        this._trailsTimeToNext += dt;
        vec3.subtract(this._trailsOffsetAccu, this._trailsOffsetAccu, movement);

        const iterationCount = Math.trunc(this._trailsTimeToNext / POSITION_OFFSET_DELTA);
        if (!iterationCount) return;

        const
            fraction = POSITION_OFFSET_DELTA / this._trailsTimeToNext,
            cumulativeOffset = vec3.scale(vec3_1, this._trailsOffsetAccu, fraction * iterationCount);

        if (iterationCount < 20)
        {
            if (vec3.squaredLength(this._trailsOffsetAccu) > 0.00001)
            {
                for (let i = 0; i < this._trailsOffsets.length; i++)
                {
                    vec3.add(this._trailsOffsets[i], this._trailsOffsets[i], cumulativeOffset);
                }
            }

            for (let i = 0; i < iterationCount; i++)
            {
                this._trailsOffsetLatest = WrapOffsetIndex(this._trailsOffsetLatest + 1);
                vec3.scale(this._trailsOffsets[this._trailsOffsetLatest], this._trailsOffsetAccu, (iterationCount - 1 - i) * fraction);
            }
        }
        else
        {
            this._trailsOffsetLatest = WrapOffsetIndex(this._trailsOffsetLatest + 1);

            const partialOffset = vec3.scale(vec3_2, this._trailsOffsetAccu, fraction);

            for (let i = 0; i < POSITION_OFFSET_COUNT; i++)
            {
                const relativeIndex = WrapOffsetIndex(i - this._trailsOffsetLatest);
                if (relativeIndex < iterationCount)
                {
                    vec3.scale(this._trailsOffsets[i], partialOffset, iterationCount - 1 - relativeIndex);
                }
                else
                {
                    vec3.add(this._trailsOffsets[i], this._trailsOffsets[i], cumulativeOffset);
                }
            }

            this._trailsOffsetLatest = WrapOffsetIndex(this._trailsOffsetLatest + iterationCount - 1);
        }

        vec3.subtract(this._trailsOffsetAccu, this._trailsOffsetAccu, cumulativeOffset);
        this._trailsTimeToNext -= POSITION_OFFSET_DELTA * iterationCount;
    }

    /**
     * Recomputes everything derived from the control points: total trail
     * length, world trail bounds padded by the booster sphere radius, the per
     * point tangent normals with their length factors, and the normalized per
     * segment lengths
     */
    UpdateSplineMetrics()
    {
        this.trailsTotalLength = 0;
        for (let i = 1; i < CONTROL_POINT_COUNT; i++)
        {
            this.trailsTotalLength += vec3.distance(this._trailsControlPositions[i], this._trailsControlPositions[i - 1]);
        }

        vec3.set(this._trailsBoundsMin, Infinity, Infinity, Infinity);
        vec3.set(this._trailsBoundsMax, -Infinity, -Infinity, -Infinity);

        const radius = sph3.radius(this.GetBoundingSphere(sph3_0));

        for (let i = 0; i < this._trailsControlPositions.length; i++)
        {
            const position = this._trailsControlPositions[i];
            for (let axis = 0; axis < 3; axis++)
            {
                this._trailsBoundsMin[axis] = Math.min(this._trailsBoundsMin[axis], position[axis] - radius);
                this._trailsBoundsMax[axis] = Math.max(this._trailsBoundsMax[axis], position[axis] + radius);
            }
        }

        const firstLength = Math.min(
            this._boosterSet.trailsSmoothing,
            vec3.distance(this._trailsControlPositions[1], this._trailsControlPositions[0])
        );

        vec3.set(vec3_0, 0, 0, -firstLength);
        TransformNormal(this._trailsControlNormals[0], vec3_0, this._parentTransform);

        const last = CONTROL_POINT_COUNT - 1;
        vec3.subtract(this._trailsControlNormals[last], this._trailsControlPositions[last], this._trailsControlPositions[last - 1]);
        vec3.scale(this._trailsControlNormals[last], this._trailsControlNormals[last], 0.5);

        for (let i = 1; i < last; i++)
        {
            const normal = vec3.subtract(
                this._trailsControlNormals[i],
                this._trailsControlPositions[i + 1],
                this._trailsControlPositions[i - 1]
            );

            const
                nextLength = vec3.distance(this._trailsControlPositions[i + 1], this._trailsControlPositions[i]),
                previousLength = vec3.distance(this._trailsControlPositions[i], this._trailsControlPositions[i - 1]);

            if (vec3.squaredLength(normal)) vec3.normalize(normal, normal);
            vec3.scale(normal, normal, nextLength);
            this._trailsControlNormalsFactor[i] = nextLength ? previousLength / nextLength : 0;
        }

        this._trailsSequenceLength[0] = 0;
        for (let i = 1; i < CONTROL_POINT_COUNT; i++)
        {
            const length = vec3.distance(this._trailsControlPositions[i], this._trailsControlPositions[i - 1]);
            this._trailsSequenceLength[i] = this.trailsTotalLength ? length / this.trailsTotalLength : 0;
        }
    }

    /**
     * Gets the world bounding sphere
     *
     * The authored sphere is pushed back half a radius to cover the exhaust
     * glow, its centre transformed into world space, and its radius doubled.
     * The radius is set outright rather than run through `sph3.transformMat4`,
     * because Carbon transforms only the centre and never scales w.
     * @param {sph3} out
     * @returns {sph3} out
     */
    GetBoundingSphere(out)
    {
        const boosterSet = this._boosterSet;
        if (!boosterSet) return sph3.empty(out);

        out[0] = boosterSet.boosterBoundingSphereCenter[0];
        out[1] = boosterSet.boosterBoundingSphereCenter[1];
        out[2] = boosterSet.boosterBoundingSphereCenter[2] - 0.5 * boosterSet.boosterBoundingSphereRadius;
        vec3.transformMat4(out, out, this._parentTransform);
        out[3] = 2 * boosterSet.boosterBoundingSphereRadius;
        return out;
    }

    /**
     * Updates lod
     *
     * Carbon gates the boosters and the trails on their own pixel size against
     * booster-specific detail thresholds. ccpwgl has no equivalent of those:
     * `LodLevelPixels` is a whole-hull scale - 20 pixels for "drawn at all" -
     * and a booster's bounding sphere is metres where a hull's is hundreds. Run
     * against those numbers the gate reads a normally framed ship as too small
     * and switches its boosters off, and `boosterHighLod` (which would need 150)
     * never becomes true at all.
     *
     * So the visibility gates follow the owner's lod, which is the vocabulary
     * ccpwgl's other attachments already use, and the pixel size is kept only
     * for the near/far effect choice, where being wrong costs detail rather
     * than the whole draw.
     *
     * @param {Tw2Frustum} frustum
     * @param {Number} [parentLod=3] - the owner's lod level
     * @returns {Boolean} isVisible
     */
    UpdateLod(frustum, parentLod = 3)
    {
        if (!frustum || !this._boosterSet)
        {
            this.isVisible = false;
            this.boostersVisible = false;
            this.trailsVisible = false;
            return false;
        }

        this.boostersVisible = parentLod >= 1;
        this.trailsVisible = parentLod >= 1;

        const
            sphere = this.GetBoundingSphere(sph3_0),
            radius = sph3.radius(sphere);

        // Only picks between effect and effectFar; a set with no far effect
        // falls back to the near one either way.
        this.boosterHighLod = parentLod >= 2 ||
            2 * frustum.GetPixelSizeAcross(sphere, radius) > LodLevelPixels.ZERO;

        // A booster whose hull is off screen still renders while its trail
        // crosses the view, so the bounds test is an OR and not a refinement.
        this.isVisible = frustum.IsSphereVisible(sphere, radius) ||
            (Number.isFinite(this._trailsBoundsMin[0]) &&
                frustum.IntersectsBounds(this._trailsBoundsMin, this._trailsBoundsMax));

        return this.isVisible;
    }

    /**
     * Writes the frame's constants into the shared booster per object data
     *
     * The ship matrix is transposed for the shader, both five slot trail arrays
     * are written in full, and the padding scalars are left alone exactly as
     * Carbon leaves them uninitialized.
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Tw2PerObjectData} perObjectData
     */
    FillPerObjectData(perObjectData)
    {
        mat4.transpose(perObjectData.vs.Get("WorldMat"), this._parentTransform);

        const vsBooster = perObjectData.vs.Get("BoosterData");
        vsBooster[0] = this.overallIntensity;
        vsBooster[1] = this.parentSpeed;
        vsBooster[2] = this._boosterSet ? this._boosterSet.maxSize : 0;

        const psBooster = perObjectData.ps.Get("BoosterData");
        psBooster[0] = this.overallIntensity;
        psBooster[1] = this.trailIntensity;
        psBooster[2] = this._boosterSet ? this._boosterSet.warpIntensity : 0;

        const
            positions = perObjectData.vs.Get("TrailsControlPositions"),
            normals = perObjectData.vs.Get("TrailsControlNormals");

        for (let i = 0; i < CONTROL_POINT_COUNT; i++)
        {
            const
                position = this._trailsControlPositions[i],
                normal = this._trailsControlNormals[i],
                o = i * 4;

            positions[o] = position[0];
            positions[o + 1] = position[1];
            positions[o + 2] = position[2];
            positions[o + 3] = this._trailsSequenceLength[i];

            normals[o] = normal[0];
            normals[o + 1] = normal[1];
            normals[o + 2] = normal[2];
            normals[o + 3] = this._trailsControlNormalsFactor[i];
        }

        return perObjectData;
    }

    /**
     * Per object data layout
     *
     * This mirrors Carbon's `EveBoosterSetPerObjectData` register for register:
     * cb3[0..3] ship matrix, cb3[4] (boosterIntensity, shipSpeed,
     * maxBoosterSize, pad), cb3[5..9] trail control positions, cb3[10..14]
     * trail control normals; cb4[0] (boosterIntensity, trailIntensity,
     * warpIntensity, pad).
     * @type {{ps: Array, vs: Array}}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "BoosterData", 4 ],
            [ "TrailsControlPositions", 20 ],
            [ "TrailsControlNormals", 20 ]
        ],
        ps: [
            [ "BoosterData", 4 ]
        ]
    };

}


/**
 * Maps 0..1 through a sine ease so a trail length fade starts and ends flat
 * instead of stepping
 * @param {Number} value
 * @returns {Number}
 */
function SinSmooth(value)
{
    return Math.sin(value * Math.PI - Math.PI / 2) / 2 + 0.5;
}

/**
 * Applies only a transform's upper 3x3 rotation and scale to a vector, leaving
 * its translation out, so a direction stays a direction
 * @param {vec3} out
 * @param {vec3} value
 * @param {mat4} transform
 * @returns {vec3} out
 */
function TransformNormal(out, value, transform)
{
    const x = value[0], y = value[1], z = value[2];
    out[0] = transform[0] * x + transform[4] * y + transform[8] * z;
    out[1] = transform[1] * x + transform[5] * y + transform[9] * z;
    out[2] = transform[2] * x + transform[6] * y + transform[10] * z;
    return out;
}

/**
 * Wraps an index into the trail offset ring, handling negative values so the
 * ring can be walked backwards
 * @param {Number} index
 * @returns {Number}
 */
function WrapOffsetIndex(index)
{
    return ((index % POSITION_OFFSET_COUNT) + POSITION_OFFSET_COUNT) % POSITION_OFFSET_COUNT;
}

const CONTROL_POINT_COUNT = 5;
const POSITION_OFFSET_COUNT = 300;
const POSITION_OFFSET_DELTA = 0.0167;
const TRAIL_MIN_LENGTH = 200;
const TRAIL_MIN_LENGTH_FADE = 1000;
const TRAIL_MAX_LENGTH = 50000;
const TRAIL_MAX_LENGTH_FADE = 20000;

const ZERO = vec3.create();
const Z_AXIS = vec3.fromValues(0, 0, 1);

const vec3_0 = vec3.create();
const vec3_1 = vec3.create();
const vec3_2 = vec3.create();
const vec3_parent = vec3.create();
const sph3_0 = sph3.create();
