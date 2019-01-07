import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleAttractorForce
 * @ccp Tr2ParticleAttractorForce
 * @implements ParticleForce
 *
 * @parameter {Number} magnitude -
 * @parameter {vec3} position    -
 */
export default class Tw2ParticleAttractorForce extends Tw2StagingClass
{

    magnitude = 0;
    position = vec3.create();

}

Tw2StagingClass.define(Tw2ParticleAttractorForce, Type =>
{
    return {
        type: "Tw2ParticleAttractorForce",
        category: "ParticleForce",
        props: {
            magnitude: Type.NUMBER,
            position: Type.TR_TRANSLATION
        }
    };
});

