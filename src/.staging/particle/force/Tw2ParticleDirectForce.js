import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleDirectForce
 * @ccp Tr2ParticleDirectForce
 * @implements ParticleForce
 *
 * @parameter {vec3} force -
 */
export default class Tw2ParticleDirectForce extends Tw2StagingClass
{

    force = vec3.create();

}

Tw2StagingClass.define(Tw2ParticleDirectForce, Type =>
{
    return {
        type: "Tw2ParticleDirectForce",
        category: "ParticleForce",
        props: {
            force: Type.VECTOR3
        }
    };
});

