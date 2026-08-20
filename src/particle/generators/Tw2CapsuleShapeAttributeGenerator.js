import { meta } from "utils";
import { quat, vec3 } from "math";
import { Tw2ParticleAttributeGenerator } from "./Tw2ParticleAttributeGenerator";
import { Tw2ParticleElement } from "../element";


/**
 * Spawns particles within a capsule: a cone direction sampled between phi/theta
 * limits, placed along the segment between a start and end transform.
 *
 * Carbon: `Tr2CapsuleShapeAttributeGenerator.cpp:64-120`. One random `amount`
 * drives both the rotation slerp and the position lerp, so a particle's
 * direction and its position along the capsule stay consistent.
 *
 * On the rotation: Carbon writes `conj(q) * v * q`, which looks inverted but is
 * DirectXMath's own idiom - its `XMQuaternionMultiply` takes its arguments in
 * reverse order, making that expression the standard "rotate v by q". It is the
 * same operation as `vec3.transformQuat`, which is what the sphere generator
 * beside this one already uses.
 */
@meta.type("Tw2CapsuleShapeAttributeGenerator", "Tr2CapsuleShapeAttributeGenerator")
@meta.define({
    wgl: "Tw2CapsuleShapeAttributeGenerator",
    ccp: "Tr2CapsuleShapeAttributeGenerator"
})
export class Tw2CapsuleShapeAttributeGenerator extends Tw2ParticleAttributeGenerator
{

    @meta.float
    minPhi = 0;

    @meta.float
    maxPhi = 360;

    @meta.float
    minTheta = 0;

    @meta.float
    maxTheta = 360;

    @meta.float
    minRadius = 0;

    @meta.float
    maxRadius = 0;

    @meta.float
    minSpeed = 0;

    @meta.float
    maxSpeed = 0;

    @meta.float
    parentVelocityFactor = 1;

    @meta.boolean
    controlVelocity = true;

    @meta.vector3
    positionStart = vec3.create();

    @meta.vector3
    positionEnd = vec3.create();

    @meta.quaternion
    rotationStart = quat.create();

    @meta.quaternion
    rotationEnd = quat.create();

    @meta.struct("Tw2ParticleElement")
    _position = null;

    @meta.struct("Tw2ParticleElement")
    _velocity = null;

    /**
     * Binds the position element, and the velocity element when this generator
     * controls velocity.
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean}
     */
    Bind(ps)
    {
        this._position = null;
        this._velocity = null;

        for (let i = 0; i < ps._elements.length; ++i)
        {
            const element = ps._elements[i];
            if (element.elementType === Tw2ParticleElement.Type.POSITION) this._position = element;
            else if (element.elementType === Tw2ParticleElement.Type.VELOCITY && this.controlVelocity) this._velocity = element;
        }

        return this._position !== null && (!this.controlVelocity || this._velocity !== null);
    }

    /**
     * Writes one particle's position, and velocity when controlled.
     * @param {Tw2ParticleElement} position - the parent's position, or null
     * @param {Tw2ParticleElement} velocity - the parent's velocity, or null
     * @param {Number} index
     */
    Generate(position, velocity, index)
    {
        const
            g = Tw2CapsuleShapeAttributeGenerator.global,
            direction = g.vec3_0,
            point = g.vec3_1,
            rotation = g.quat_0,
            phi = (this.minPhi + Math.random() * (this.maxPhi - this.minPhi)) / 180 * Math.PI,
            theta = (this.minTheta + Math.random() * (this.maxTheta - this.minTheta)) / 180 * Math.PI;

        vec3.set(direction,
            Math.sin(phi) * Math.cos(theta),
            -Math.cos(phi),
            Math.sin(phi) * Math.sin(theta));

        // One sample drives both ends of the capsule, so direction and position
        // stay in step (cpp:88-91).
        const amount = Math.random();
        quat.slerp(rotation, this.rotationStart, this.rotationEnd, amount);
        vec3.transformQuat(direction, direction, rotation);

        if (this._velocity)
        {
            const
                speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed),
                offset = this._velocity.startOffset + index * this._velocity.instanceStride;

            this._velocity.buffer[offset] = direction[0] * speed;
            this._velocity.buffer[offset + 1] = direction[1] * speed;
            this._velocity.buffer[offset + 2] = direction[2] * speed;

            if (velocity)
            {
                this._velocity.buffer[offset] += velocity.buffer[velocity.offset] * this.parentVelocityFactor;
                this._velocity.buffer[offset + 1] += velocity.buffer[velocity.offset + 1] * this.parentVelocityFactor;
                this._velocity.buffer[offset + 2] += velocity.buffer[velocity.offset + 2] * this.parentVelocityFactor;
            }
        }

        if (this._position)
        {
            const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
            vec3.lerp(point, this.positionStart, this.positionEnd, amount);

            const offset = this._position.startOffset + index * this._position.instanceStride;
            this._position.buffer[offset] = direction[0] * radius + point[0];
            this._position.buffer[offset + 1] = direction[1] * radius + point[1];
            this._position.buffer[offset + 2] = direction[2] * radius + point[2];

            if (position)
            {
                this._position.buffer[offset] += position.buffer[position.offset];
                this._position.buffer[offset + 1] += position.buffer[position.offset + 1];
                this._position.buffer[offset + 2] += position.buffer[position.offset + 2];
            }
        }
    }

    /**
     * Sets both capsule endpoints.
     * @param {vec3} startPosition
     * @param {quat} startRotation
     * @param {vec3} endPosition
     * @param {quat} endRotation
     */
    SetPositions(startPosition, startRotation, endPosition, endRotation)
    {
        vec3.copy(this.positionStart, startPosition);
        quat.copy(this.rotationStart, startRotation);
        vec3.copy(this.positionEnd, endPosition);
        quat.copy(this.rotationEnd, endRotation);
    }

    /**
     * Scratch
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        quat_0: quat.create()
    };

}
