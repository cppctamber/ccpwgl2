import { meta } from "utils";
import { vec3, mat4 } from "math";
import { Tw2PerObjectData } from "core";
import { EveObject } from "./EveObject";


@meta.type("EveMissileWarhead")
@meta.stage(2)
export class EveMissileWarhead extends EveObject
{

    @meta.notImplemented
    @meta.float
    acceleration = 1;

    @meta.float
    durationEjectPhase = 0;

    @meta.notImplemented
    @meta.float
    impactDuration = 0.6;

    @meta.float
    impactSize = 0;

    @meta.float
    maxExplosionDistance = 40;

    @meta.struct("Tw2Mesh")
    mesh = null;

    @meta.list("Tw2ParticleEmitter")
    particleEmitters = [];

    @meta.notImplemented
    @meta.float
    pathOffsetNoiseScale = 0;

    @meta.notImplemented
    @meta.float
    pathOffsetNoiseSpeed = 0;

    @meta.struct("EveSpriteSet")
    spriteSet = null;

    @meta.float
    startEjectVelocity = 0;

    @meta.notImplemented
    @meta.float
    warheadLength = 0;

    @meta.notImplemented
    @meta.float
    warheadRadius = 0;


    _perObjectData = Tw2PerObjectData.from(EveMissileWarhead.perObjectData);
    _state = EveMissileWarhead.State.READY;
    _time = 0;
    _transform = mat4.create();
    _velocity = vec3.create();


    /**
     * Initializes the warhead
     */
    Initialize()
    {
        if (this.spriteSet) this.spriteSet.UseQuads(true);
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);
        if (this.spriteSet) this.spriteSet.GetResources(out);
        return out;
    }

    /**
     * Sets up the warhead for rendering
     * @param {mat4} transform - Initial local to world transform
     */
    Launch(transform)
    {
        mat4.copy(this._transform, transform);
        this._velocity[0] = transform[8] * this.startEjectVelocity;
        this._velocity[1] = transform[9] * this.startEjectVelocity;
        this._velocity[2] = transform[10] * this.startEjectVelocity;
        this._time = 0;
        this._state = EveMissileWarhead.State.IN_FLIGHT;
    }

    /**
     * Per frame view dependent data update
     */
    UpdateViewDependentData()
    {
        if (!this.display || this._state === EveMissileWarhead.State.DEAD) return;
        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._transform);
        mat4.transpose(this._perObjectData.vs.Get("WorldMatLast"), this._transform);
    }

    /**
     * Per frame update
     * @param {Number} dt - Time since previous frame
     * @param {vec3} missilePosition - Missile position
     * @param {vec3} missileTarget - Missile target position
     */
    Update(dt, missilePosition, missileTarget)
    {
        if (this._state === EveMissileWarhead.State.IN_FLIGHT)
        {
            const
                g = EveObject.global,
                position = mat4.getTranslation(g.vec3_0, this._transform),
                tmp = g.vec3_1,
                x = g.vec3_2,
                y = g.vec3_3;

            this._time += dt;
            if (this._time > this.durationEjectPhase)
            {
                vec3.subtract(position, this._velocity, missilePosition);
                vec3.lerp(position, position, missilePosition, 1 - Math.exp(-dt * 0.9999));
                mat4.setTranslation(this._transform, position);
                vec3.subtract(tmp, missileTarget, position);
                if (vec3.length(tmp) < this.maxExplosionDistance)
                {
                    console.log(position, tmp);
                    this._state = EveMissileWarhead.State.DEAD;
                }
            }
            else
            {
                vec3.scale(tmp, this._velocity, dt);
                this._transform[12] += tmp[0];
                this._transform[13] += tmp[1];
                this._transform[14] += tmp[2];
            }

            const z = vec3.normalize(tmp, this._velocity);

            if (Math.abs(z[0]) < 0.99)
            {
                vec3.cross(x, z, [ 1, 0, 0 ]);
            }
            else
            {
                vec3.cross(x, z, [ 0, 1, 0 ]);
            }

            vec3.normalize(x, x);
            vec3.cross(y, x, z);
            this._transform[0] = x[0];
            this._transform[1] = x[1];
            this._transform[2] = x[2];
            this._transform[4] = y[0];
            this._transform[5] = y[1];
            this._transform[6] = y[2];
            this._transform[8] = z[0];
            this._transform[9] = z[1];
            this._transform[10] = z[2];
        }

        if (this.spriteSet)
        {
            this.spriteSet.Update(dt);
        }
    }

    /**
     * Accumulates render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this.mesh && this._state !== EveMissileWarhead.State.DEAD)
        {
            if (this.mesh)
            {
                this.mesh.GetBatches(mode, accumulator, this._perObjectData);
            }

            if (this.spriteSet)
            {
                this.spriteSet.GetBatches(mode, accumulator, this._perObjectData, this._transform);
            }
        }
    }

    /**
     * Per object data
     * @type {*}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "Shipdata", [ 0, 1, 0, -10 ] ],
            [ "Clipdata1", 4 ],
            [ "JointMat", 696 ]
        ],
        ps: [
            [ "Shipdata", [ 0, 1, 0, 1 ] ],
            [ "Clipdata1", 4 ],
            [ "Clipdata2", 4 ],
        ]
    };

    /**
     * Missile warhead states
     * @type {{READY: number, IN_FLIGHT: number, DEAD: number}}
     */
    static State = {
        READY: 0,
        IN_FLIGHT: 1,
        DEAD: 2
    };

}


@meta.type("EveMissile")
@meta.stage(2)
export class EveMissile extends EveObject
{

    @meta.vector3
    @meta.isPrivate
    boundingSphereCenter = vec3.create();

    @meta.notImplemented
    @meta.float
    @meta.isPrivate
    boundingSphereRadius = 0;

    @meta.notImplemented
    @meta.struct("Tr2TranslationAdapter")
    modelTranslationCurve = null;

    @meta.list("EveMissileWarhead")
    warheads = [];

    @meta.list("Tw2CurveSet")
    @meta.todo("Is this deprecated?")
    curveSets = [];

    @meta.float
    speed = 1;


    _position = vec3.create();
    _target = vec3.create();
    _warheadExplosionCallback = null;
    _missileFinishedCallback = null;


    /**
     * Sets a callback which is fired when a warhead explodes
     * @param {Function} callback
     */
    OnWarheadExplosion(callback)
    {
        this._warheadExplosionCallback = callback;
    }

    /**
     * Sets a callback which is fired when a missile has finished
     * @param {Function} callback
     */
    OnMissileFinished(callback)
    {
        this._missileFinishedCallback = callback;
    }

    /**
     * Prepares missile for rendering
     * @param {vec3} position - Missile starting _position
     * @param {Array} turretTransforms - Turret muzzle local to world transforms
     * @param {vec3} target - Target position
     */
    Launch(position, turretTransforms, target)
    {
        vec3.copy(this._position, position);
        vec3.copy(this._target, target);

        if (this.warheads.length > turretTransforms.length)
        {
            this.warheads.splice(turretTransforms.length);
        }
        else
        {
            while (this.warheads.length < turretTransforms.length)
            {
                this.warheads.push(this.constructor.CloneWarhead(this.warheads[0]));
            }
        }

        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[0].Launch(turretTransforms[i]);
        }
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].GetResources(out);
        }
        return out;
    }

    /**
     * Per frame view dependent data update
     */
    UpdateViewDependentData()
    {
        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].UpdateViewDependentData();
        }
    }

    /**
     * Per frame update
     * @param {Number} dt - Time since previous frame
     */
    Update(dt)
    {
        const
            tmp = vec3.subtract(EveObject.global.vec3_0, this._target, this._position),
            distance = vec3.length(tmp);

        if (distance > 0.1)
        {
            vec3.normalize(tmp, tmp);
            vec3.scale(tmp, tmp, Math.min(dt * this.speed, distance));
            vec3.add(this._position, this._position, tmp);
        }

        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }

        let checkDead = false;
        for (let i = 0; i < this.warheads.length; ++i)
        {
            const _state = this.warheads[i]._state;
            this.warheads[i].Update(dt, this._position, this._target);

            if (_state !== EveMissileWarhead.State.DEAD && this.warheads[i]._state === EveMissileWarhead.State.DEAD)
            {
                if (this._warheadExplosionCallback)
                {
                    this._warheadExplosionCallback(this.warheads[i]);
                }
                checkDead = true;
            }
        }

        if (checkDead && this._missileFinishedCallback)
        {
            for (let i = 0; i < this.warheads.length; ++i)
            {
                if (this.warheads[i]._state !== EveMissileWarhead.State.DEAD)
                {
                    return;
                }
            }
            this._missileFinishedCallback(this);
        }
    }

    /**
     * Accumulates render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return;

        for (let i = 0; i < this.warheads.length; ++i)
        {
            this.warheads[i].GetBatches(mode, accumulator);
        }
    }

    /**
     * Clones a warhead
     * @param {EveMissileWarhead} sourceWarhead
     * @returns {EveMissileWarhead}
     */
    static CloneWarhead(sourceWarhead)
    {
        const warhead = new EveMissileWarhead();
        warhead.mesh = sourceWarhead.mesh;
        warhead.spriteSet = sourceWarhead.spriteSet;
        return warhead;
    }

}
