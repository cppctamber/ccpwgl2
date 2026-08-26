import { meta } from "utils";
import { vec3, vec4 } from "math";
import { Tw2ParticleEmitter } from "particle/emitter/Tw2ParticleEmitter";


// One scratch buffer for the params hash: 33 floats, the EmitterParams fields
// in declaration order.
const HASH_FLOATS = new Float32Array(33);


@meta.define("Tr2GpuSharedEmitter", true)
@meta.notImplemented
export class Tr2GpuSharedEmitter extends Tw2ParticleEmitter
{

    @meta.string
    name = "";

    @meta.float
    angle = 0;

    @meta.color
    color0 = vec4.create();

    @meta.color
    color1 = vec4.create();

    @meta.color
    color2 = vec4.create();

    @meta.color
    color3 = vec4.create();

    @meta.float
    colorMidpoint = 0.5;

    @meta.boolean
    continuousEmitter = true;

    @meta.vector3
    direction = vec3.fromValues(0, 1, 0);

    @meta.float
    drag = 0;

    @meta.float
    emissionDensity = 0;

    @meta.float
    gravity = 0;

    @meta.float
    inheritVelocity = 1;

    @meta.float
    innerAngle = 0;

    @meta.float
    maxDisplacement = 1000;

    @meta.float
    maxEmissionDensity = 10000;

    @meta.float
    maxLifeTime = 0;

    @meta.float
    maxSpeed = 0;

    @meta.float
    minLifeTime = 0;

    @meta.float
    minSpeed = 0;

    @meta.struct("Tr2GpuParticleSystem")
    particleSystem = null;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.float
    rate = 0;

    @meta.float
    sizeVariance = 0;

    @meta.vector3
    sizes = vec3.create();

    @meta.uint
    textureIndex = 0;

    @meta.float
    turbulenceAmplitude = 0;

    @meta.uint
    turbulenceFrequency = 1;

    @meta.float
    velocityStretchRotation = 0;

    _enabled = true;

    _previousTime = -1;

    _emitterId = 0;

    _paramsHash = 0;

    _carryOver = 0;

    _prevPosition = vec3.create();

    _prevVelocity = vec3.create();

    _prevDirection = vec3.create();

    /**
     * A multiplier a subclass can arm so the parent transform's scale reaches
     * the emitted values. One for a shared emitter, which is never scaled.
     * @type {Number}
     */
    _uniformScale = 1;

    Initialize()
    {
        this.UpdateHash();
        this.GenerateID();
        return true;
    }

    OnModified()
    {
        this.UpdateHash();
        this.GenerateID();
        return true;
    }

    Enable(enable)
    {
        this._enabled = !!enable;
        if (!this._enabled)
        {
            this._previousTime = -1;
        }
    }

    /**
     * Hashes the persistent parameters.
     *
     * The hash is a GROUPING KEY, and only that: emitters whose parameters are
     * identical share one set on the GPU, which is the whole reason a shared
     * emitter is cheaper than a unique one. Two emitters must hash alike when
     * their parameters match and differently when they do not; the value itself
     * is never persisted, transmitted or compared against Carbon's.
     *
     * DIVERGENCE, deliberately. Carbon runs FNV1 over the raw `EmitterParams`
     * struct (Tr2GpuSharedEmitter.cpp:57-60), so its value depends on C++ struct
     * padding and float bit patterns. Reproducing that would mean reproducing a
     * memory layout for no gain, since nothing outside the running engine ever
     * sees the number. This hashes the same FIELDS in the same order over their
     * float bits, which satisfies the only property the value has to have.
     *
     * @param {Object} [params] - defaults to this emitter's own
     * @returns {Number}
     */
    GetHash(params = this.GetParamsData(Tr2GpuSharedEmitter.global.hashParams))
    {
        const f = Tr2GpuSharedEmitter.global.hashFloats;

        // EmitterParams declaration order (Tr2GpuParticleSystem.h:45-63).
        f[0] = params.minLifeTime;
        f[1] = params.maxLifeTime;
        f[2] = params.textureIndex;
        f[3] = params.colorMidpoint;

        for (let i = 0; i < 4; i++)
        {
            f[4 + i * 4] = params.colors[i][0];
            f[5 + i * 4] = params.colors[i][1];
            f[6 + i * 4] = params.colors[i][2];
            f[7 + i * 4] = params.colors[i][3];
        }

        f[20] = params.sizes[0];
        f[21] = params.sizes[1];
        f[22] = params.sizes[2];
        f[23] = params.sizeVariance;
        f[24] = params.drag;
        f[25] = params.turbulenceAmplitude;
        f[26] = params.turbulenceFrequency;
        f[27] = params.gravity;
        f[28] = params.attractorPosition[0];
        f[29] = params.attractorPosition[1];
        f[30] = params.attractorPosition[2];
        f[31] = params.attractorStrength;
        f[32] = params.velocityStretchRotation;

        // FNV-1a over the float bits, so -0 and 0 hash alike only if their bits
        // do - which is the same discrimination Carbon's byte-wise hash makes.
        const u = Tr2GpuSharedEmitter.global.hashWords;
        let hash = 2166136261;

        for (let i = 0; i < f.length; i++)
        {
            hash = Math.imul(hash ^ (u[i] & 0xff), 16777619);
            hash = Math.imul(hash ^ ((u[i] >>> 8) & 0xff), 16777619);
            hash = Math.imul(hash ^ ((u[i] >>> 16) & 0xff), 16777619);
            hash = Math.imul(hash ^ ((u[i] >>> 24) & 0xff), 16777619);
        }

        return hash >>> 0;
    }

    UpdateHash()
    {
        this._paramsHash = this.GetHash();
    }

    GenerateID()
    {
        this._emitterId = this.GetID(this._paramsHash);
    }

    /**
     * Turns a params hash into an emitter id.
     *
     * The id's job is to say WHICH emitter a batch came from, and one bit of it
     * says whether that emitter is shared or unique: a shared id has
     * {@link Tr2GpuSharedEmitter.UNIQUE_BIT} clear, a unique id has it set
     * (Tr2GpuUniqueEmitter.cpp:11). A shared id is otherwise the params hash, so
     * two shared emitters with identical parameters ARE the same emitter to the
     * system, which is the point of them.
     *
     * Carbon writes the mask as `1 << (sizeof(uintptr_t) - 1)`, which is bit 7
     * on a 64-bit build rather than the top bit the shape of the expression
     * suggests. Both sides use the same expression, so the discriminator works
     * either way; the bit index is reproduced rather than "corrected", because
     * correcting it would change which ids collide.
     *
     * @param {Number} hash
     * @returns {Number}
     */
    GetID(hash)
    {
        return (hash || 0) & ~Tr2GpuSharedEmitter.UNIQUE_BIT;
    }

    SetDirection(direction)
    {
        vec3.copy(this.direction, direction);
    }

    SetPosition(position)
    {
        vec3.copy(this.position, position);
    }

    Setup(rate, emitterData, paramsData)
    {
        this.rate = rate;
        if (emitterData)
        {
            if (emitterData.position) vec3.copy(this.position, emitterData.position);
            if (emitterData.direction) vec3.copy(this.direction, emitterData.direction);
            if (emitterData.angle !== undefined) this.angle = emitterData.angle;
            if (emitterData.innerAngle !== undefined) this.innerAngle = emitterData.innerAngle;
            if (emitterData.radius !== undefined) this.radius = emitterData.radius;
            if (emitterData.minSpeed !== undefined) this.minSpeed = emitterData.minSpeed;
            if (emitterData.maxSpeed !== undefined) this.maxSpeed = emitterData.maxSpeed;
        }
        if (paramsData)
        {
            if (paramsData.minLifeTime !== undefined) this.minLifeTime = paramsData.minLifeTime;
            if (paramsData.maxLifeTime !== undefined) this.maxLifeTime = paramsData.maxLifeTime;
            if (paramsData.textureIndex !== undefined) this.textureIndex = paramsData.textureIndex;
            if (paramsData.colorMidpoint !== undefined) this.colorMidpoint = paramsData.colorMidpoint;
            if (paramsData.sizes) vec3.copy(this.sizes, paramsData.sizes);
            if (paramsData.sizeVariance !== undefined) this.sizeVariance = paramsData.sizeVariance;
            if (paramsData.drag !== undefined) this.drag = paramsData.drag;
            if (paramsData.turbulenceAmplitude !== undefined) this.turbulenceAmplitude = paramsData.turbulenceAmplitude;
            if (paramsData.turbulenceFrequency !== undefined) this.turbulenceFrequency = paramsData.turbulenceFrequency;
            if (paramsData.gravity !== undefined) this.gravity = paramsData.gravity;
            if (paramsData.velocityStretchRotation !== undefined) this.velocityStretchRotation = paramsData.velocityStretchRotation;
        }

        this.UpdateHash();
        this.GenerateID();
    }

    /**
     * Per frame update - continuous emission.
     *
     * Ported from Tr2GpuSharedEmitter.cpp:107-146. The emitter does no GPU work
     * of its own: it accounts for how many particles are owed this frame and
     * hands one batch to the system, which is what actually dispatches. So all
     * of this is CPU and testable without a device.
     *
     * @param {Object} args - see {@link Tr2GpuSharedEmitter.UpdateArguments}
     */
    Update(args)
    {
        if (!args || !args.system)
        {
            // A missing system resets the clock rather than pausing it, so the
            // frame after one reappears is treated as a first frame and cannot
            // bill a huge dt against it.
            this._previousTime = -1;
            return;
        }

        if (!this._enabled) return;

        const
            time = args.time || 0,
            firstUpdate = this._previousTime === -1,
            dt = firstUpdate ? 0 : time - this._previousTime;

        this._previousTime = time;

        if (dt <= 0 && !firstUpdate) return;

        const
            g = Tr2GpuSharedEmitter.global,
            originShift = args.originShift || Tr2GpuSharedEmitter.ZERO,
            position = vec3.transformMat4(g.vec3_0, this.position, args.parentTransform),
            velocity = g.vec3_1;

        if (!firstUpdate)
        {
            // The shift is subtracted from the DISPLACEMENT, not from either
            // position: a world origin rebase moves the ship without the
            // emitter having moved, and billing that as velocity would fire a
            // frame's worth of particles in a line.
            vec3.subtract(velocity, position, this._prevPosition);
            vec3.subtract(velocity, velocity, originShift);
            vec3.scale(velocity, velocity, 1 / dt);
        }
        else
        {
            vec3.subtract(this._prevPosition, position, originShift);
            vec3.set(velocity, 0, 0, 0);
        }

        if (this.continuousEmitter)
        {
            const from = vec3.add(g.vec3_2, this._prevPosition, originShift);

            this._carryOver = this._SpawnBatch(
                args,
                from,
                position,
                this._prevVelocity,
                velocity,
                this._carryOver,
                Math.min(dt, Tr2GpuSharedEmitter.MAXIMUM_FRAME_TIME)
            );
        }

        vec3.copy(this._prevPosition, position);
        vec3.copy(this._prevVelocity, velocity);
    }

    /**
     * Spawns a burst at a position, outside the continuous schedule.
     *
     * Ported from Tr2GpuSharedEmitter.cpp:148-163. Start and end are the same
     * point, so the displacement gate and the density term both contribute
     * nothing and the count is `rate * rateModifier` alone.
     *
     * @param {Object} args
     * @param {vec3} [position] - defaults to the emitter's own
     * @param {vec3} [velocity]
     * @param {Number} [rateModifier=1]
     */
    SpawnParticles(args, position, velocity, rateModifier = 1)
    {
        if (!args || !args.system || !this._enabled) return;

        const
            g = Tr2GpuSharedEmitter.global,
            pos = vec3.transformMat4(g.vec3_0, position || this.position, args.parentTransform),
            vel = g.vec3_1;

        if (velocity)
        {
            Tr2GpuSharedEmitter.TransformNormal(vel, velocity, args.parentTransform);
        }
        else
        {
            vec3.set(vel, 0, 0, 0);
        }

        // Carry-over is NOT threaded through a burst: it passes zero in and
        // discards the result, so a burst neither consumes nor leaves a
        // fractional debt on the continuous stream.
        this._SpawnBatch(args, pos, pos, vel, vel, 0, rateModifier);
    }

    /**
     * Spawns along a segment, for a caller that knows where it moved.
     *
     * Ported from Tr2GpuSharedEmitter.cpp:165-190. Unlike the burst above this
     * one DOES thread the carry-over, because it is a substitute for the
     * continuous update rather than an addition to it.
     *
     * @param {Object} args
     * @param {vec3} [positionStart]
     * @param {vec3} [positionEnd]
     * @param {vec3} [velocityStart]
     * @param {vec3} [velocityEnd]
     * @param {Number} deltaTime
     */
    SpawnParticlesOverSegment(args, positionStart, positionEnd, velocityStart, velocityEnd, deltaTime)
    {
        if (!args || !args.system || !this._enabled) return;

        const
            g = Tr2GpuSharedEmitter.global,
            originShift = args.originShift || Tr2GpuSharedEmitter.ZERO,
            posEnd = vec3.transformMat4(g.vec3_0, positionEnd || this.position, args.parentTransform),
            posStart = g.vec3_2,
            velStart = g.vec3_1,
            velEnd = g.vec3_3;

        if (positionStart)
        {
            vec3.transformMat4(posStart, positionStart, args.parentTransform);
            vec3.subtract(posStart, posStart, originShift);
        }
        else
        {
            vec3.copy(posStart, posEnd);
        }

        if (velocityStart && velocityEnd)
        {
            Tr2GpuSharedEmitter.TransformNormal(velStart, velocityStart, args.parentTransform);
            Tr2GpuSharedEmitter.TransformNormal(velEnd, velocityEnd, args.parentTransform);
            vec3.subtract(velEnd, velEnd, originShift);
        }
        else
        {
            vec3.set(velStart, 0, 0, 0);
            vec3.set(velEnd, 0, 0, 0);
        }

        this._carryOver = this._SpawnBatch(
            args,
            posStart,
            posEnd,
            velStart,
            velEnd,
            this._carryOver,
            Math.min(deltaTime, Tr2GpuSharedEmitter.MAXIMUM_FRAME_TIME)
        );
    }

    /**
     * Spawns one batch immediately, optionally scaled.
     *
     * Ported from Tr2GpuSharedEmitter.cpp:232-275. The count comes straight
     * from the rate with no time in it at all - this is "emit this many now".
     *
     * A scale other than 1 changes the PARAMS as well as the emitter, so it
     * changes the params hash, and therefore the id: a scaled burst is a
     * different emitter as far as the system's grouping is concerned. That is
     * Carbon's behaviour and it is load bearing, because the params are shared
     * between everything that hashes alike.
     *
     * @param {Object} args
     * @param {vec3} velocity
     * @param {Number} [scale=1]
     * @param {Number} [rateModifier=1]
     */
    SpawnOnce(args, velocity, scale = 1, rateModifier = 1)
    {
        if (!args || !args.system || !this._enabled) return;

        const count = Math.floor(this.rate * rateModifier);
        if (!count) return;

        const
            g = Tr2GpuSharedEmitter.global,
            emitter = this.GetEmitterData(g.emitter);

        emitter.count = count;
        emitter.radius *= scale;
        emitter.minSpeed *= scale;
        emitter.maxSpeed *= scale;

        vec3.transformMat4(emitter.position, this.position, args.parentTransform);
        vec3.copy(emitter.positionPrevious, emitter.position);

        vec3.copy(emitter.velocity, velocity);
        vec3.copy(emitter.velocityPrevious, velocity);

        Tr2GpuSharedEmitter.TransformNormal(emitter.direction, this.direction, args.parentTransform);
        vec3.copy(emitter.directionPrevious, emitter.direction);

        let
            id = this._emitterId,
            hash = this._paramsHash,
            params = this.GetParamsData(g.params);

        if (scale !== 1)
        {
            vec3.scale(params.sizes, params.sizes, scale);
            params.turbulenceAmplitude *= scale;
            params.turbulenceFrequency = Math.floor(params.turbulenceFrequency / scale);

            hash = this.GetHash(params);
            id = this.GetID(hash);
        }

        args.system.Emit(emitter, id, hash, params);
    }

    /**
     * The counting, shared by every spawn path.
     *
     * Ported from Tr2GpuSharedEmitter.cpp:192-230.
     *
     * @param {Object} args
     * @param {vec3} positionStart
     * @param {vec3} positionEnd
     * @param {vec3} velocityStart
     * @param {vec3} velocityEnd
     * @param {Number} carryOverCount
     * @param {Number} deltaTime
     * @returns {Number} the fractional particle carried into the next call
     * @private
     */
    _SpawnBatch(args, positionStart, positionEnd, velocityStart, velocityEnd, carryOverCount, deltaTime, persistDirection)
    {
        // The identity is refreshed HERE, on every batch, because this is the
        // one place every spawn path passes through - the continuous schedule,
        // a one-off burst and a swept segment all end up here.
        //
        // Nothing else called UpdateHash or GenerateID, which left every shared
        // emitter reporting hash 0 and id 0. To the system that made them all
        // the SAME emitter: one row of parameters shared by every emitter in
        // the scene, so the first one to register decided the colour, size and
        // drag of all of them. It is invisible until a second emitter exists.
        //
        // Recomputed rather than cached, deliberately. A shared emitter is not
        // allowed to animate these parameters - that is what makes it shared -
        // and recomputing means a violation shows up as a new row rather than
        // as silently stale values. Thirty-three floats of FNV is nothing
        // against a batch of particles.
        this.UpdateHash();
        this.GenerateID();

        const
            g = Tr2GpuSharedEmitter.global,
            emitter = this.GetEmitterData(g.emitter),
            move = vec3.subtract(g.vec3_4, positionEnd, positionStart),
            moveLength = vec3.length(move);

        vec3.copy(emitter.position, positionEnd);

        let total = carryOverCount + deltaTime * this.rate * (args.emitCountFactor === undefined ? 1 : args.emitCountFactor);

        // A jump further than maxDisplacement is a TELEPORT, not motion, and
        // the carry-over is dropped with the batch. Emitting across it would
        // draw a line of particles between where the object was and where it
        // now is.
        if (moveLength > this.maxDisplacement) return 0;

        // Distance-based emission, capped so a fast pass does not empty the
        // whole budget in one frame.
        if (this.emissionDensity > 0)
        {
            total += Math.min(this.maxEmissionDensity, moveLength * this.emissionDensity);
        }

        carryOverCount = total - Math.floor(total);
        emitter.count = Math.max(Math.floor(total), 0);

        if (emitter.count)
        {
            vec3.copy(emitter.positionPrevious, positionStart);

            vec3.scale(emitter.velocity, velocityEnd, this.inheritVelocity);
            vec3.scale(emitter.velocityPrevious, velocityStart, this.inheritVelocity);

            // The PREVIOUS direction is this emitter's own, from its last
            // batch, and it has to be - the shader interpolates between the two
            // so a turning emitter sweeps rather than snapping.
            //
            // It is kept on the emitter rather than in the scratch struct
            // because the scratch is shared: reading `emitter.direction` back
            // out of it, as the first version of this did, hands one emitter
            // whichever direction the last DIFFERENT emitter happened to leave
            // there.
            vec3.copy(emitter.directionPrevious, this._prevDirection);
            Tr2GpuSharedEmitter.TransformNormal(emitter.direction, this.direction, args.parentTransform);

            // Only the continuous path remembers it. Carbon makes the same
            // distinction by passing the member by reference from Update
            // (cpp:141) and a COPY from the burst paths (cpp:160, 187), so a
            // burst reads the running direction without disturbing it.
            if (persistDirection) vec3.copy(this._prevDirection, emitter.direction);

            args.system.Emit(emitter, this._emitterId, this._paramsHash, this.GetParamsData(g.params));
        }

        return carryOverCount;
    }

    /**
     * Fills the CPU-side emitter struct the system's Emit takes.
     * @param {Object} [out={}]
     * @returns {Object}
     */
    GetEmitterData(out = {})
    {
        out.position = out.position || vec3.create();
        out.positionPrevious = out.positionPrevious || vec3.create();
        out.direction = out.direction || vec3.create();
        out.directionPrevious = out.directionPrevious || vec3.create();
        out.velocity = out.velocity || vec3.create();
        out.velocityPrevious = out.velocityPrevious || vec3.create();

        out.count = 0;
        out.emitterSeed = 0;

        // Scaled where a subclass armed it. Radius and the two speeds are
        // lengths, so they follow the parent's scale; the angles do not.
        out.radius = this.radius * this._uniformScale;
        out.angle = this.angle;
        out.innerAngle = this.innerAngle;
        out.minSpeed = this.minSpeed * this._uniformScale;
        out.maxSpeed = this.maxSpeed * this._uniformScale;
        return out;
    }

    /**
     * Fills the persistent parameter struct.
     *
     * These are the values that are SHARED between every emitter hashing alike,
     * which is what makes a shared emitter cheap and why it must not animate
     * them - see the class header.
     *
     * @param {Object} [out={}]
     * @returns {Object}
     */
    GetParamsData(out = {})
    {
        out.colors = out.colors || [ vec4.create(), vec4.create(), vec4.create(), vec4.create() ];
        out.sizes = out.sizes || vec3.create();
        out.attractorPosition = out.attractorPosition || vec3.create();

        out.minLifeTime = this.minLifeTime;
        out.maxLifeTime = this.maxLifeTime;
        out.textureIndex = this.textureIndex;
        out.colorMidpoint = this.colorMidpoint;
        vec4.copy(out.colors[0], this.color0);
        vec4.copy(out.colors[1], this.color1);
        vec4.copy(out.colors[2], this.color2);
        vec4.copy(out.colors[3], this.color3);
        vec3.scale(out.sizes, this.sizes, this._uniformScale);
        out.sizeVariance = this.sizeVariance;
        out.drag = this.drag;
        out.turbulenceAmplitude = this.turbulenceAmplitude * this._uniformScale;
        out.turbulenceFrequency = this.turbulenceFrequency;
        out.gravity = this.gravity * this._uniformScale;
        vec3.set(out.attractorPosition, 0, 0, 0);
        out.attractorStrength = 0;
        out.velocityStretchRotation = this.velocityStretchRotation;
        return out;
    }

    /**
     * Transforms a DIRECTION - the rotation and scale of a transform, without
     * its translation.
     * @param {vec3} out
     * @param {vec3} v
     * @param {mat4} m
     * @returns {vec3} out
     */
    static TransformNormal(out, v, m)
    {
        const
            x = v[0],
            y = v[1],
            z = v[2];

        out[0] = x * m[0] + y * m[4] + z * m[8];
        out[1] = x * m[1] + y * m[5] + z * m[9];
        out[2] = x * m[2] + y * m[6] + z * m[10];
        return out;
    }

    /**
     * A frame longer than this is billed as this.
     *
     * Carbon clamps at 1/15s (Tr2GpuSharedEmitter.cpp:9). A stall would
     * otherwise emit a whole second of particles at once, which both looks
     * wrong and can exhaust the system's budget in a single frame.
     * @type {Number}
     */
    static MAXIMUM_FRAME_TIME = 1 / 15;

    /**
     * No origin shift. vec3 has no ZERO constant of its own.
     * @type {vec3}
     */
    static ZERO = vec3.create();

    /**
     * The bit that says an id belongs to a UNIQUE emitter rather than a shared
     * one. Carbon: 1 << (sizeof(uintptr_t) - 1).
     * @type {Number}
     */
    static UNIQUE_BIT = 1 << 7;

    /**
     * @type {Object}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec3_3: vec3.create(),
        vec3_4: vec3.create(),
        emitter: {},
        params: {},

        // Scratch for the hash, and the same buffer read two ways: the floats
        // are written, the words are hashed, so the hash sees the float BITS
        // rather than their decimal value - the discrimination Carbon's
        // byte-wise hash makes.
        hashParams: {},
        hashFloats: HASH_FLOATS,
        hashWords: new Uint32Array(HASH_FLOATS.buffer)
    };

    SetThreadSafeFlag()
    {
    }

}
