import { meta, vec3 } from "global";
import { Tw2ParticleForce } from "./Tw2ParticleForce";


/**
 * Tw2ParticleSpring
 *
 * @property {number} springConstant
 * @property {vec3} position
 */
@meta.ccp("Tr2ParticleSpring")
export class Tw2ParticleSpring extends Tw2ParticleForce
{

    @meta.black.float
    springConstant = 0;

    @meta.black.vector3
    position = vec3.create();


    /**
     * Applies force
     * @param {Tw2ParticleElement} position - Position
     * @param {Tw2ParticleElement} velocity - Velocity
     * @param {vec3} force                  - force
     * @param {Number} [dt]                 - unused
     * @param {Number} [mass]               - unused
     */
    ApplyForce(position, velocity, force, dt, mass)
    {
        force[0] += (this.position[0] - position.buffer[position.offset]) * this.springConstant;
        force[1] += (this.position[1] - position.buffer[position.offset + 1]) * this.springConstant;
        force[2] += (this.position[2] - position.buffer[position.offset + 2]) * this.springConstant;
    }

}
