import { vec3, vec4, noise } from "../../global";
import { Tw2ParticleForce } from "./Tw2ParticleForce";

/**
 * Tw2ParticleTurbulenceForce
 * @ccp Tr2ParticleTurbulenceForce
 *
 * @property {vec3} amplitude    -
 * @property {vec4} frequency    -
 * @property {Number} noiseLevel -
 * @property {Number} noiseRatio -
 * @property {number} _time      -
 */
export class Tw2ParticleTurbulenceForce extends Tw2ParticleForce
{

    amplitude = vec3.fromValues(1, 1, 1);
    frequency = vec4.fromValues(1, 1, 1, 1);
    noiseLevel = 3;
    noiseRatio = 0.5;

    _time = 0;


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
        if (this.noiseLevel === 0) return;

        let pos_0 = position.buffer[position.offset] * this.frequency[0],
            pos_1 = position.buffer[position.offset + 1] * this.frequency[1],
            pos_2 = position.buffer[position.offset + 2] * this.frequency[2],
            pos_3 = this._time * this.frequency[3];

        let sum = 0,
            power = 0.5,
            frequency = 1 / this.noiseRatio;

        const out = vec4.set(Tw2ParticleForce.global.vec4_0, 0, 0, 0, 0);

        for (let i = 0; i < this.noiseLevel; ++i)
        {
            noise.turbulence(out, pos_0, pos_1, pos_2, pos_3, power);
            sum += power;
            pos_0 *= frequency;
            pos_1 *= frequency;
            pos_2 *= frequency;
            pos_3 *= frequency;
            power *= this.noiseRatio;
        }

        force[0] += out[0] * this.amplitude[0] * sum;
        force[1] += out[1] * this.amplitude[1] * sum;
        force[2] += out[2] * this.amplitude[2] * sum;
    }

    /**
     * Per frame update (Called before ApplyForce)
     * @param {number} dt - delta Time
     */
    Update(dt)
    {
        this._time += dt;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "amplitude", r.vector3 ],
            [ "frequency", r.vector4 ],
            [ "noiseLevel", r.float ],
            [ "noiseRatio", r.float ]
        ];
    }

}
