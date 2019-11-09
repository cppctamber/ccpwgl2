import { vec3 } from "global";
import { Tw2ParticleForce } from "./Tw2ParticleForce";

/**
 * Tw2ParticleAttractorForce
 * @ccp Tr2ParticleAttractorForce
 *
 * @property {number} magnitude
 * @property {vec3} position
 */
export class Tw2ParticleAttractorForce extends Tw2ParticleForce
{

    magnitude = 0;
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
        const vec3_0 = Tw2ParticleForce.global.vec3_0;

        vec3_0[0] = this.position[0] - position.buffer[position.offset];
        vec3_0[1] = this.position[1] - position.buffer[position.offset + 1];
        vec3_0[2] = this.position[2] - position.buffer[position.offset + 2];

        vec3.normalize(vec3_0, vec3_0);
        vec3.scale(vec3_0, vec3_0, this.magnitude);
        vec3.add(force, force, vec3_0);
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "magnitude", r.float ],
            [ "position", r.vector3 ]
        ];
    }

}
