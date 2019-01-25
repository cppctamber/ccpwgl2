import {vec3} from "../../global/index";
import {Tw2ParticleForce} from "./Tw2ParticleForce";

/**
 * EveParticleDirectForce
 * Todo: Is this just a copy of Tw2ParticleDirectForce?
 *
 * @property {vec3} force -
 */
export class EveParticleDirectForce extends Tw2ParticleForce
{

    force = vec3.create();

}

Tw2ParticleForce.define(EveParticleDirectForce, Type =>
{
    return {
        isStaging: true,
        type: "EveParticleDirectForce",
        props: {
            force: Type.VECTOR3
        }
    };
});

