import { meta } from "utils";
import { vec3, vec4 } from "math";
import { Tw2ParticleEmitter } from "particle/emitter/Tw2ParticleEmitter";


@meta.type("Tr2GpuSharedEmitter")
@meta.ccp.define("Tr2GpuSharedEmitter")
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

    GetHash()
    {
        const values = [
            this.minLifeTime,
            this.maxLifeTime,
            this.sizeVariance,
            this.textureIndex,
            this.colorMidpoint,
            this.drag,
            this.turbulenceAmplitude,
            this.turbulenceFrequency,
            this.gravity,
            this.velocityStretchRotation,
            this.attractorStrength || 0
        ];

        let hash = 2166136261;
        for (let i = 0; i < values.length; i++)
        {
            hash ^= Math.fround(values[i] || 0) * 1000000 | 0;
            hash = Math.imul(hash, 16777619);
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

    GetID(hash)
    {
        return (hash || 0) & 0x7fffffff;
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

    Update()
    {
    }

    SpawnParticles()
    {
        return 0;
    }

    SpawnOnce()
    {
    }

    SetThreadSafeFlag()
    {
    }

}
