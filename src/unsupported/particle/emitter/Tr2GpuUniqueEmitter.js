import { meta } from "utils";
import { vec3 } from "math";
import { Tr2GpuSharedEmitter } from "./Tr2GpuSharedEmitter";


/**
 * An emitter whose persistent parameters are its OWN.
 *
 * A shared emitter's parameters are pooled with every other emitter that hashes
 * alike, which is why it is cheap and why it must not animate them. A unique
 * emitter keeps its own set on the GPU, so it may - and pays memory for it.
 * Carbon's own guidance is to prefer shared wherever possible
 * (Tr2GpuUniqueEmitter.h:10-14).
 *
 * Two things need a unique emitter:
 *
 * **An attractor.** `attractorPosition` is authored in the emitter's own space
 * and has to be transformed into the world every frame, so it changes - and a
 * changing parameter cannot be shared.
 *
 * **Scaling by the parent.** With `scaledByParent`, a parent's scale multiplies
 * the sizes, speeds and forces, so two instances of the same emitter at
 * different scales are genuinely different emitters.
 */
@meta.define("Tr2GpuUniqueEmitter", true)
@meta.notImplemented
export class Tr2GpuUniqueEmitter extends Tr2GpuSharedEmitter
{

    @meta.boolean
    scaledByParent = false;

    @meta.vector3
    attractorPosition = vec3.create();

    @meta.float
    attractorStrength = 0;

    /**
     * The id is assigned ONCE, at construction, and never derived from the
     * parameter hash.
     *
     * That is the whole difference from a shared emitter. A shared id IS the
     * hash, so two shared emitters with matching parameters are one emitter to
     * the system; a unique id is per instance, so they are two - which is what
     * makes it safe for this one's parameters to move.
     *
     * Carbon builds it from the object address, a timestamp and the unique bit
     * (Tr2GpuUniqueEmitter.cpp:11). A pointer is not available here, so a
     * counter stands in: the requirement is distinctness within a session, and
     * a counter delivers that more reliably than an address, which can be
     * reused after a free.
     */
    constructor()
    {
        super();
        this._emitterId = Tr2GpuUniqueEmitter.NextID();
    }

    /**
     * Deliberately does nothing.
     *
     * The base class regenerates the id from the params hash whenever the
     * parameters change. A unique emitter must NOT: its id identifies the
     * instance, and its parameters are expected to move
     * (Tr2GpuUniqueEmitter.cpp:14-16).
     */
    GenerateID()
    {
    }

    /**
     * Per frame update, with the parent's scale and the attractor folded in.
     *
     * Ported from Tr2GpuUniqueEmitter.cpp:18-53. Carbon copies the emitter and
     * params structs aside, mutates them, and copies them back; here the scale
     * is a multiplier the getters apply, so there is nothing to restore and no
     * window in which a half-scaled emitter could be read.
     *
     * @param {Object} args
     */
    Update(args)
    {
        const scaled = this._ApplyParentScale(args);
        super.Update(args);
        if (scaled) this._ClearParentScale();
    }

    /**
     * @param {Object} args
     * @param {vec3} [position]
     * @param {vec3} [velocity]
     * @param {Number} [rateModifier]
     */
    SpawnParticles(args, position, velocity, rateModifier)
    {
        const scaled = this._ApplyParentScale(args);
        super.SpawnParticles(args, position, velocity, rateModifier);
        if (scaled) this._ClearParentScale();
    }

    /**
     * @param {Object} args
     * @param {vec3} [positionStart]
     * @param {vec3} [positionEnd]
     * @param {vec3} [velocityStart]
     * @param {vec3} [velocityEnd]
     * @param {Number} deltaTime
     */
    SpawnParticlesOverSegment(args, positionStart, positionEnd, velocityStart, velocityEnd, deltaTime)
    {
        const scaled = this._ApplyParentScale(args);
        super.SpawnParticlesOverSegment(args, positionStart, positionEnd, velocityStart, velocityEnd, deltaTime);
        if (scaled) this._ClearParentScale();
    }

    /**
     * Adds this emitter's attractor to the shared parameters.
     *
     * The position is in the WORLD by the time it reaches the params, because
     * the GPU has no parent transform to apply it with. That is also why an
     * attractor forces a unique emitter: a world position is different for every
     * instance, so it cannot be pooled.
     *
     * @param {Object} [out]
     * @returns {Object}
     */
    GetParamsData(out)
    {
        const params = super.GetParamsData(out);

        params.attractorStrength = this.attractorStrength * this._uniformScale;
        vec3.copy(params.attractorPosition, this._attractorWorld);
        return params;
    }

    /**
     * Works out the parent's uniform scale and the attractor's world position,
     * and arms them for the getters.
     *
     * @param {Object} args
     * @returns {Boolean} true if a scale was applied and must be cleared
     * @private
     */
    _ApplyParentScale(args)
    {
        if (!args || !args.parentTransform) return false;

        if (this.attractorStrength !== 0)
        {
            vec3.transformMat4(this._attractorWorld, this.attractorPosition, args.parentTransform);
            vec3.subtract(this._attractorWorld, this._attractorWorld, args.originShift || Tr2GpuSharedEmitter.ZERO);
        }
        else
        {
            vec3.set(this._attractorWorld, 0, 0, 0);
        }

        if (!this.scaledByParent)
        {
            // Still rehash if the attractor moved - it is a parameter, and the
            // hash is what says two emitters can share one set.
            if (this.attractorStrength !== 0) this.UpdateHash();
            return false;
        }

        // The MEAN of the three axis scales, which is what Carbon's
        // dot(scale, replicate(1/3)) computes. A non-uniform scale therefore
        // averages rather than picking an axis.
        const scale = mat4GetScaling(Tr2GpuUniqueEmitter.global.vec3_scale, args.parentTransform);
        this._uniformScale = (scale[0] + scale[1] + scale[2]) / 3;

        this.UpdateHash();
        return true;
    }

    /**
     * @private
     */
    _ClearParentScale()
    {
        this._uniformScale = 1;
        this.UpdateHash();
    }

    _attractorWorld = vec3.create();

    /**
     * @returns {Number}
     */
    static NextID()
    {
        // The unique bit set, and never colliding with a shared id, which has
        // it clear by construction.
        Tr2GpuUniqueEmitter._nextId = (Tr2GpuUniqueEmitter._nextId + 1) >>> 0;
        return (Tr2GpuUniqueEmitter._nextId | Tr2GpuSharedEmitter.UNIQUE_BIT) >>> 0;
    }

    static _nextId = 0;

    static global = {
        vec3_scale: vec3.create()
    };

}


/**
 * The scale a transform carries, as three axis lengths.
 * @param {vec3} out
 * @param {mat4} m
 * @returns {vec3} out
 */
function mat4GetScaling(out, m)
{
    out[0] = Math.hypot(m[0], m[1], m[2]);
    out[1] = Math.hypot(m[4], m[5], m[6]);
    out[2] = Math.hypot(m[8], m[9], m[10]);
    return out;
}
