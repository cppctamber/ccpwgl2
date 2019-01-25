import {vec3} from "../../global";
import {Tw2ParticleForce} from "./Tw2ParticleForce";

/**
 * Tw2ParticleSpring
 * @ccp Tr2ParticleSpring
 *
 * @property {number} springConstant
 * @property {vec3} position
 */
export class Tw2ParticleSpring extends Tw2ParticleForce
{

    springConstant = 0;
    position = vec3.create();


    /**
     * Applies force
     * @param {Tw2ParticleElement} position - Position
     * @param {Tw2ParticleElement} velocity - Velocity
     * @param {Tw2ParticleElement} force    - force
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

Tw2ParticleForce.define(Tw2ParticleSpring, Type =>
{
    return {
        type: "Tw2ParticleSpring",
        props: {
            position: Type.TR_TRANSLATION,
            springConstant: Type.NUMBER
        }
    };
});

