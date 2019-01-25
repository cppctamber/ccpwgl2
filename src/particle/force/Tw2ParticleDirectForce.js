import {vec3} from "../../global";
import {Tw2ParticleForce} from "./Tw2ParticleForce";
/**
 * Tw2ParticleDirectForce
 * @ccp Tr2ParticleDirectForce
 *
 * @property {vec3} force
 */
export class Tw2ParticleDirectForce extends Tw2ParticleForce
{

    force = vec3.create();


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
        vec3.add(force, force, this.force);
    }

}

Tw2ParticleForce.define(Tw2ParticleDirectForce, Type =>
{
    return {
        type: "Tw2ParticleDirectForce",
        category: "ParticleForce",
        props: {
            force: Type.VECTOR3
        }
    };
});