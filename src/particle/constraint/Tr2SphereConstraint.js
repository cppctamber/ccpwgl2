import { meta } from "utils";
import { vec3, vec4 } from "math";
import { Tw2ParticleConstraint } from "./Tw2ParticleConstraint";
import { Tw2ParticleElement } from "../element";


/**
 * Keeps particles outside a sphere, or inside it when inverted, reflecting
 * velocity and firing generators and emitters on contact.
 *
 * Carbon: `Tr2SphereConstraint.cpp:99-260`. Two branches - particles already in
 * the prohibited space are projected onto the surface (`cpp:142-178`), and the
 * rest get a swept segment-vs-sphere test against this frame's motion
 * (`cpp:179-239`).
 */
@meta.type("Tr2SphereConstraint")
@meta.define({ ccp: "Tr2SphereConstraint" })
export class Tr2SphereConstraint extends Tw2ParticleConstraint
{

    @meta.boolean
    affectPosition = true;

    @meta.boolean
    affectVelocity = true;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 1;

    @meta.float
    elasticity = 1;

    @meta.float
    friction = 1;

    @meta.boolean
    invertSphere = false;

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

    _position = null;
    _velocity = null;
    _radius = null;

    /**
     * Resolves the elements this constraint reads and binds its generators.
     * A missing POSITION is fatal, a missing VELOCITY is not - Carbon's own
     * asymmetry (`Tr2SphereConstraint.cpp:270-328`).
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

        this.isValid = true;
        return true;
    }

    /**
     * Applies the sphere to every alive particle.
     *
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {Number} aliveCount
     * @param {Number} dt
     * @returns {Number} how many particles were processed
     */
    ApplyConstraint(buffers, instanceStride, aliveCount, dt = 0)
    {
        if (!this.isValid) return 0;

        const
            invert = this.invertSphere ? -1 : 1,
            // Carbon compares against the CONSTRAINT radius (cpp:112); a
            // per-particle radius only shifts where the particle is projected to.
            radiusCmp = this.radius * this.radius * invert,
            position = this._position,
            velocity = this._velocity,
            g = Tr2SphereConstraint.global,
            pos = g.vec3_0,
            vel = g.vec3_1,
            offset = g.vec3_2;

        let processed = 0;

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

            let radius = this.radius;
            if (this._radius)
            {
                const particleRadius = this.DotRadius(this._radius, i);
                radius += this.invertSphere ? -particleRadius : particleRadius;
            }

            vec3.subtract(offset, pos, this.position);
            const distanceSquared = vec3.squaredLength(offset);

            if (distanceSquared * invert < radiusCmp)
            {
                if (this.affectPosition)
                {
                    const length = Math.sqrt(distanceSquared);
                    if (length > 0) vec3.scale(offset, offset, 1 / length);
                    else vec3.set(offset, 0, 1, 0);

                    vec3.scaleAndAdd(pos, this.position, offset, radius);
                    this.WritePosition(position, positionOffset, pos);

                    if (this.affectVelocity && velocity)
                    {
                        vec3.scale(offset, offset, invert);
                        this.ReflectVelocity(vel, offset);
                        this.WriteVelocity(velocity, velocityOffset, vel);
                    }
                }
            }
            else if (velocity)
            {
                // Swept segment-vs-sphere (cpp:179-239).
                const
                    a = vec3.squaredLength(vel),
                    b = 2 * vec3.dot(vel, offset),
                    c = distanceSquared - this.radius * this.radius,
                    determinant = b * b - 4 * a * c;

                if (determinant < 0 || a === 0) continue;

                const
                    root = Math.sqrt(determinant),
                    time = this.invertSphere ? (-b + root) / (2 * a) : (-b - root) / (2 * a);

                if (time > dt || time < 0) continue;

                if (this.affectPosition)
                {
                    vec3.scaleAndAdd(pos, pos, vel, time);
                    this.WritePosition(position, positionOffset, pos);

                    if (this.affectVelocity)
                    {
                        vec3.subtract(offset, pos, this.position);
                        vec3.normalize(offset, offset);
                        vec3.scale(offset, offset, invert);
                        this.ReflectVelocity(vel, offset);
                        this.WriteVelocity(velocity, velocityOffset, vel);
                    }
                }
            }

            processed++;
            this.FireCollision(position, positionOffset, velocity, velocityOffset, i);
        }

        return processed;
    }

    /**
     * Bounce and slide against the surface normal (`cpp:154-175`).
     *
     * When reflectionNoise is set Carbon REPLACES the reflected velocity with
     * tangential noise scaled by the post-bounce speed (`cpp:162-173`) - the
     * plane constraint adds instead, and the difference is deliberate.
     *
     * @param {vec3} velocity
     * @param {vec3} normal
     */
    ReflectVelocity(velocity, normal)
    {
        const velocityDot = vec3.dot(velocity, normal);
        if (velocityDot >= 0) return;

        const
            g = Tr2SphereConstraint.global,
            bounce = g.vec3_3,
            slide = g.vec3_4;

        vec3.scale(bounce, normal, -velocityDot);
        vec3.add(slide, velocity, bounce);
        vec3.scale(bounce, bounce, this.elasticity);
        vec3.scale(slide, slide, this.friction);
        vec3.add(velocity, bounce, slide);

        if (this.reflectionNoise > 0)
        {
            const noise = g.vec3_5;
            vec3.set(noise, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
            vec3.scale(noise, noise, this.reflectionNoise);
            vec3.scaleAndAdd(noise, noise, normal, -vec3.dot(noise, normal));
            vec3.scale(velocity, noise, vec3.length(velocity));
        }
    }

    /**
     * Runs the generators and on-collision emitters for one particle, through
     * ccpwgl's element-cursor convention. See the note on the plane constraint.
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
     * The effective particle radius: the radius element dotted with the coefficient.
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
     * @param {Tw2ParticleElement} element
     * @param {Number} offset
     * @param {vec3} value
     */
    WritePosition(element, offset, value)
    {
        element.buffer[offset] = value[0];
        element.buffer[offset + 1] = value[1];
        element.buffer[offset + 2] = value[2];
    }

    /**
     * @param {Tw2ParticleElement} element
     * @param {Number} offset
     * @param {vec3} value
     */
    WriteVelocity(element, offset, value)
    {
        element.buffer[offset] = value[0];
        element.buffer[offset + 1] = value[1];
        element.buffer[offset + 2] = value[2];
    }

    /**
     * Scratch
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec3_3: vec3.create(),
        vec3_4: vec3.create(),
        vec3_5: vec3.create()
    };

}
