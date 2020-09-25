import { meta, vec3, vec4, noise } from "global";
import { Tw2ParticleForce } from "./Tw2ParticleForce";


@meta.ctor("Tw2ParticleTurbulenceForce", "Tr2ParticleTurbulenceForce")
export class Tw2ParticleTurbulenceForce extends Tw2ParticleForce
{

    @meta.vector3
    amplitude = vec3.fromValues(1, 1, 1);

    @meta.vector4
    frequency = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    noiseLevel = 3;

    @meta.float
    noiseRatio = 0.5;


    _time = 0;


    /**
     * Applies force
     * @param {Tw2ParticleElement} position - position
     * @param {Tw2ParticleElement} velocity - velocity
     * @param {vec3} force                  - force
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

}
