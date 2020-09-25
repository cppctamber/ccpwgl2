import { vec3, quat, meta } from "global";
import { Tw2ParticleElement } from "../element/Tw2ParticleElement";
import { Tw2ParticleAttributeGenerator } from "./Tw2ParticleAttributeGenerator";


@meta.ctor("Tw2SphereShapeAttributeGenerator", "Tr2SphereShapeAttributeGenerator")
export class Tw2SphereShapeAttributeGenerator extends Tw2ParticleAttributeGenerator
{

    @meta.string
    customName = "";

    @meta.float
    @meta.notImplemented
    distributionExponent = 0;

    @meta.float
    maxPhi = 360;

    @meta.float
    maxRadius = 0;

    @meta.float
    maxSpeed = 0;

    @meta.float
    maxTheta = 360;

    @meta.float
    minPhi = 0;

    @meta.float
    minRadius = 0;

    @meta.float
    minSpeed = 0;

    @meta.float
    minTheta = 0;

    @meta.float
    parentVelocityFactor = 1;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.boolean
    @meta.todo("Is this deprecated?")
    controlPosition = true;

    @meta.boolean
    @meta.todo("Is this deprecated?")
    controlVelocity = true;

    @meta.struct("Tw2ParticleElement")
    _position = null;

    @meta.struct("Tw2ParticleElement")
    _velocity = null;


    /**
     * Binds a particle system element to the generator
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean} True if successfully bound
     */
    Bind(ps)
    {
        this._position = null;
        this._velocity = null;

        for (let i = 0; i < ps._elements.length; ++i)
        {
            if (ps._elements[i].elementType === Tw2ParticleElement.Type.POSITION && this.controlPosition)
            {
                this._position = ps._elements[i];
            }
            else if (ps._elements[i].elementType === Tw2ParticleElement.Type.VELOCITY && this.controlVelocity)
            {
                this._velocity = ps._elements[i];
            }
        }
        return (!this.controlPosition || this._position !== null) && (!this.controlVelocity || this._velocity !== null);
    }

    /**
     * Generates the attributes
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {number} index
     */
    Generate(position, velocity, index)
    {
        const
            phi = (this.minPhi + Math.random() * (this.maxPhi - this.minPhi)) / 180 * Math.PI,
            theta = (this.minTheta + Math.random() * (this.maxTheta - this.minTheta)) / 180 * Math.PI,
            rv = Tw2ParticleAttributeGenerator.global.vec3_0;

        rv[0] = Math.sin(phi) * Math.cos(theta);
        rv[1] = -Math.cos(phi);
        rv[2] = Math.sin(phi) * Math.sin(theta);
        vec3.transformQuat(rv, rv, this.rotation);

        if (this._velocity)
        {
            const
                speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed),
                offset = this._velocity.instanceStride * index + this._velocity.startOffset;

            this._velocity.buffer[offset] = rv[0] * speed;
            this._velocity.buffer[offset + 1] = rv[1] * speed;
            this._velocity.buffer[offset + 2] = rv[2] * speed;

            if (velocity)
            {
                this._velocity.buffer[offset] += velocity.buffer[velocity.offset] * this.parentVelocityFactor;
                this._velocity.buffer[offset + 1] += velocity.buffer[velocity.offset + 1] * this.parentVelocityFactor;
                this._velocity.buffer[offset + 2] += velocity.buffer[velocity.offset + 2] * this.parentVelocityFactor;
            }
        }

        if (this._position)
        {
            vec3.scale(rv, rv, this.minRadius + Math.random() * (this.maxRadius - this.minRadius));
            vec3.add(rv, rv, this.position);

            if (position)
            {
                rv[0] += position.buffer[position.offset];
                rv[1] += position.buffer[position.offset + 1];
                rv[2] += position.buffer[position.offset + 2];
            }

            const offset = this._position.instanceStride * index + this._position.startOffset;
            this._position.buffer[offset] = rv[0];
            this._position.buffer[offset + 1] = rv[1];
            this._position.buffer[offset + 2] = rv[2];
        }
    }

}
