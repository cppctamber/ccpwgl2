import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ParticleDirectForce
 * @implements ParticleForce
 *
 * @property {vec3} force -
 */
export default class Tr2ParticleDirectForce extends Tw2BaseClass
{

    force = vec3.create();

}

Tw2BaseClass.define(Tr2ParticleDirectForce, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleDirectForce",
        category: "ParticleForce",
        props: {
            force: Type.VECTOR3
        }
    };
});

