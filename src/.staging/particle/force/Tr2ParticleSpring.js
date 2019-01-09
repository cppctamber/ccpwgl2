import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2ParticleSpring
 * @implements ParticleForce
 *
 * @parameter {vec3} position         -
 * @parameter {Number} springConstant -
 */
export default class Tr2ParticleSpring extends Tw2BaseClass
{

    position = vec3.create();
    springConstant = 0;

}

Tw2BaseClass.define(Tr2ParticleSpring, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleSpring",
        category: "ParticleForce",
        props: {
            position: Type.TR_TRANSLATION,
            springConstant: Type.NUMBER
        }
    };
});

