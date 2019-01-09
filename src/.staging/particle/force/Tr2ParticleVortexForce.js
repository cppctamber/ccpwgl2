import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2ParticleVortexForce
 * @implements ParticleForce
 *
 * @parameter {vec3} axis        -
 * @parameter {Number} magnitude -
 * @parameter {vec3} position    -
 */
export default class Tr2ParticleVortexForce extends Tw2BaseClass
{

    axis = vec3.create();
    magnitude = 0;
    position = vec3.create();

}

Tw2BaseClass.define(Tr2ParticleVortexForce, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleVortexForce",
        category: "ParticleForce",
        props: {
            axis: Type.VECTOR3,
            magnitude: Type.NUMBER,
            position: Type.TR_TRANSLATION
        }
    };
});

