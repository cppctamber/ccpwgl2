import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleSpring
 * @ccp Tr2ParticleSpring
 * @implements ParticleForce
 *
 * @parameter {vec3} position         -
 * @parameter {Number} springConstant -
 */
export default class Tw2ParticleSpring extends Tw2StagingClass
{

    position = vec3.create();
    springConstant = 0;

}

Tw2StagingClass.define(Tw2ParticleSpring, Type =>
{
    return {
        type: "Tw2ParticleSpring",
        category: "ParticleForce",
        props: {
            position: Type.TR_TRANSLATION,
            springConstant: Type.NUMBER
        }
    };
});

