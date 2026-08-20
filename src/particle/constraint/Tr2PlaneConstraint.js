import { meta } from "utils";
import { vec3, vec4 } from "math";
import { Tw2ParticleConstraint } from "./Tw2ParticleConstraint";
import { Tw2ParticleElement } from "../element";


/**
 * Keeps particles on one side of a plane, reflecting velocity with elasticity,
 * friction and noise, and firing generators and emitters where they hit.
 *
 * Carbon: `Tr2PlaneConstraint.cpp:114-187`.
 *
 * Note the noise difference from the sphere constraint, which is deliberate in
 * Carbon: the plane ADDS tangential noise to the reflected velocity
 * (`cpp:154-165`), while the sphere REPLACES it (`Tr2SphereConstraint.cpp:162-173`).
 */
@meta.type("Tr2PlaneConstraint")
@meta.define({ ccp: "Tr2PlaneConstraint" })
export class Tr2PlaneConstraint extends Tw2ParticleConstraint
{

    @meta.boolean
    affectPosition = true;

    @meta.boolean
    affectVelocity = true;

    @meta.vector4
    plane = vec4.fromValues(0, 1, 0, 0);

    @meta.float
    elasticity = 1;

    @meta.float
    friction = 1;

    @meta.list("Tw2ParticleEmitter")
    onCollisionEmitters = [];

    @meta.list("Tw2ParticleAttributeGenerator")
    generators = [];

    @meta.string
    particleRadiusComponent = "";

    @meta.float
    reflectionNoise = 0;

    @meta.vector4
    particleRadiusCoefficient = vec4.fromValues(1, 0, 0, 0);

    @meta.boolean
    @meta.isPrivate
    isValid = false;

    _normalizedPlane = vec4.fromValues(0, 1, 0, 0);
    _position = null;
    _velocity = null;
    _radius = null;

    /**
     * Normalises the plane. Called on bind, and again whenever the plane is
     * edited - Carbon renormalises on notify (`m_plane` is NOTIFY).
     * @returns {Boolean}
     */
    OnValueChanged()
    {
        this.NormalizePlane();
        return true;
    }

    /**
     * Recomputes the cached unit-normal plane, falling back to the default up
     * plane when the authored normal is degenerate.
     */
    NormalizePlane()
    {
        const length = Math.hypot(this.plane[0], this.plane[1], this.plane[2]);
        if (length > 0)
        {
            vec4.scale(this._normalizedPlane, this.plane, 1 / length);
        }
        else
        {
            vec4.set(this._normalizedPlane, 0, 1, 0, 0);
        }
    }

    /**
     * Resolves the elements this constraint reads and binds its generators.
     *
     * Carbon treats a missing POSITION as fatal but a missing VELOCITY as
     * optional (`Tr2PlaneConstraint.cpp` bind, mirroring the sphere's
     * `cpp:270-328`), and that asymmetry is preserved: a constraint with no
     * velocity element still pushes particles out of the plane, it just cannot
     * bounce them.
     *
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean}
     */
    Bind(ps)
    {
        this.isValid = false;
        this._position = ps.GetElement(Tw2ParticleElement.Type.POSITION);
        this._velocity = ps.GetElement(Tw2ParticleElement.Type.VELOCITY);
        this._radius = this.particleRadiusComponent ? ps.GetElement(this.particleRadiusComponent) : null;

        if (!this._position || (this.particleRadiusComponent && !this._radius)) return false;

        for (let i = 0; i < this.generators.length; ++i)
        {
            if (this.generators[i] && this.generators[i].Bind && !this.generators[i].Bind(ps)) return false;
        }

        this.NormalizePlane();
        this.isValid = true;
        return true;
    }

    /**
     * Pushes particles that crossed the plane back onto it, reflects their
     * velocity, and fires the generators and on-collision emitters.
     *
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {Number} aliveCount
     * @returns {Number} how many particles collided
     */
    ApplyConstraint(buffers, instanceStride, aliveCount)
    {
        if (!this.isValid) return 0;

        const
            normal = this._normalizedPlane,
            position = this._position,
            velocity = this._velocity,
            g = Tr2PlaneConstraint.global,
            pos = g.vec3_0,
            vel = g.vec3_1;

        let collisions = 0;

        for (let i = 0; i < aliveCount; ++i)
        {
            const positionOffset = position.startOffset + i * position.instanceStride;
            vec3.set(pos,
                position.buffer[positionOffset],
                position.buffer[positionOffset + 1],
                position.buffer[positionOffset + 2]);

            let velocityOffset = -1;
            if (velocity)
            {
                velocityOffset = velocity.startOffset + i * velocity.instanceStride;
                vec3.set(vel,
                    velocity.buffer[velocityOffset],
                    velocity.buffer[velocityOffset + 1],
                    velocity.buffer[velocityOffset + 2]);
            }

            const
                radius = this._radius ? this.DotRadius(this._radius, i) : 0,
                distance = normal[0] * pos[0] + normal[1] * pos[1] + normal[2] * pos[2] + normal[3] - radius,
                velocityDot = velocity ? vel[0] * normal[0] + vel[1] * normal[1] + vel[2] * normal[2] : -1;

            if (distance > 0 || velocityDot >= 0) continue;

            collisions++;

            if (this.affectPosition)
            {
                position.buffer[positionOffset] = pos[0] - normal[0] * distance;
                position.buffer[positionOffset + 1] = pos[1] - normal[1] * distance;
                position.buffer[positionOffset + 2] = pos[2] - normal[2] * distance;
            }

            if (this.affectVelocity && velocity)
            {
                const bounceScale = -velocityDot * this.elasticity;
                vel[0] = normal[0] * bounceScale + (vel[0] - normal[0] * velocityDot) * this.friction;
                vel[1] = normal[1] * bounceScale + (vel[1] - normal[1] * velocityDot) * this.friction;
                vel[2] = normal[2] * bounceScale + (vel[2] - normal[2] * velocityDot) * this.friction;

                this.AddReflectionNoise(vel, normal);

                velocity.buffer[velocityOffset] = vel[0];
                velocity.buffer[velocityOffset + 1] = vel[1];
                velocity.buffer[velocityOffset + 2] = vel[2];
            }

            this.FireCollision(position, positionOffset, velocity, velocityOffset, i);
        }

        return collisions;
    }

    /**
     * Runs the generators and on-collision emitters for one colliding particle.
     *
     * ccpwgl's generators and emitters take ELEMENT objects and read the source
     * particle through the element's `offset` cursor, where Carbon passes bare
     * vectors. Pointing the cursor at the colliding particle and restoring it
     * afterwards keeps this constraint inside ccpwgl's own convention instead of
     * importing Carbon's.
     *
     * @param {Tw2ParticleElement} position
     * @param {Number} positionOffset
     * @param {Tw2ParticleElement} velocity
     * @param {Number} velocityOffset
     * @param {Number} index
     */
    FireCollision(position, positionOffset, velocity, velocityOffset, index)
    {
        if (!this.generators.length && !this.onCollisionEmitters.length) return;

        const
            positionCursor = position.offset,
            velocityCursor = velocity ? velocity.offset : 0;

        position.offset = positionOffset;
        if (velocity) velocity.offset = velocityOffset;

        for (let i = 0; i < this.generators.length; ++i)
        {
            if (this.generators[i]) this.generators[i].Generate(position, velocity, index);
        }

        for (let i = 0; i < this.onCollisionEmitters.length; ++i)
        {
            if (this.onCollisionEmitters[i]) this.onCollisionEmitters[i].SpawnParticles(position, velocity, 1);
        }

        position.offset = positionCursor;
        if (velocity) velocity.offset = velocityCursor;
    }

    /**
     * The effective particle radius: the radius element dotted with the
     * coefficient.
     * @param {Tw2ParticleElement} element
     * @param {Number} index
     * @returns {Number}
     */
    DotRadius(element, index)
    {
        const offset = element.startOffset + index * element.instanceStride;
        let result = 0;
        for (let c = 0; c < Math.min(4, element.dimension); ++c)
        {
            result += element.buffer[offset + c] * this.particleRadiusCoefficient[c];
        }
        return result;
    }

    /**
     * Carbon ADDS tangential noise scaled by the post-bounce speed
     * (`Tr2PlaneConstraint.cpp:154-165`) - the sphere constraint replaces
     * instead.
     * @param {vec3} velocity
     * @param {vec4} normal
     */
    AddReflectionNoise(velocity, normal)
    {
        if (this.reflectionNoise <= 0) return;

        const noise = Tr2PlaneConstraint.global.vec3_2;
        vec3.set(noise, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        vec3.scale(noise, noise, this.reflectionNoise);
        vec3.scaleAndAdd(noise, noise, normal, -vec3.dot(noise, normal));
        vec3.scaleAndAdd(velocity, velocity, noise, vec3.length(velocity));
    }

    /**
     * Scratch
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create()
    };

}
