import { meta } from "utils";
import { vec3 } from "math";
import { Tw2ParticleForce } from "./Tw2ParticleForce";


@meta.ctor("Tw2ParticleDirectForce", "Tr2ParticleDirectForce")
export class Tw2ParticleDirectForce extends Tw2ParticleForce
{

    @meta.vector3
    force = vec3.create();


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
        vec3.add(force, force, this.force);
    }

}
