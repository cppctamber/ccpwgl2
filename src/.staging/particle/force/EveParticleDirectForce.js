import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveParticleDirectForce
 * @implements ParticleForce
 *
 * @parameter {vec3} force -
 */
export default class EveParticleDirectForce extends Tw2StagingClass
{

    force = vec3.create();

}

Tw2StagingClass.define(EveParticleDirectForce, Type =>
{
    return {
        type: "EveParticleDirectForce",
        category: "ParticleForce",
        props: {
            force: Type.VECTOR3
        }
    };
});

