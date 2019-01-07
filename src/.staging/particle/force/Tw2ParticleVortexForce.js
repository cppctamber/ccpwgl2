import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleVortexForce
 * @ccp Tr2ParticleVortexForce
 * @implements ParticleForce
 *
 * @parameter {vec3} axis        -
 * @parameter {Number} magnitude -
 * @parameter {vec3} position    -
 */
export default class Tw2ParticleVortexForce extends Tw2StagingClass
{

    axis = vec3.create();
    magnitude = 0;
    position = vec3.create();

}

Tw2StagingClass.define(Tw2ParticleVortexForce, Type =>
{
    return {
        type: "Tw2ParticleVortexForce",
        category: "ParticleForce",
        props: {
            axis: Type.VECTOR3,
            magnitude: Type.NUMBER,
            position: Type.TR_TRANSLATION
        }
    };
});

