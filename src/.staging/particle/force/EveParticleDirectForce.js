import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveParticleDirectForce
 * @implements ParticleForce
 *
 * @parameter {vec3} force -
 */
export default class EveParticleDirectForce extends Tw2BaseClass
{

    force = vec3.create();

}

Tw2BaseClass.define(EveParticleDirectForce, Type =>
{
    return {
        isStaging: true,
        type: "EveParticleDirectForce",
        category: "ParticleForce",
        props: {
            force: Type.VECTOR3
        }
    };
});

