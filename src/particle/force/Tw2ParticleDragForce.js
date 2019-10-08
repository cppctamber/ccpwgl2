import { Tw2ParticleForce } from "./Tw2ParticleForce";

/**
 * Tw2ParticleDragForce
 * @ccp Tr2ParticleDragForce
 *
 * @property {number} drag
 */
export class Tw2ParticleDragForce extends Tw2ParticleForce
{

    drag = 0.1;


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
        force[0] += velocity.buffer[velocity.offset] * -this.drag;
        force[1] += velocity.buffer[velocity.offset + 1] * -this.drag;
        force[2] += velocity.buffer[velocity.offset + 2] * -this.drag;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "drag", r.float ],
        ];
    }

}

