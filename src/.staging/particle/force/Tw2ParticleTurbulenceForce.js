import {vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleTurbulenceForce
 * @ccp Tr2ParticleTurbulenceForce
 * @implements ParticleForce
 *
 * @parameter {vec3} amplitude    -
 * @parameter {vec4} frequency    -
 * @parameter {Number} noiseLevel -
 * @parameter {Number} noiseRatio -
 */
export default class Tw2ParticleTurbulenceForce extends Tw2StagingClass
{

    amplitude = vec3.create();
    frequency = vec4.create();
    noiseLevel = 0;
    noiseRatio = 0;

}

Tw2StagingClass.define(Tw2ParticleTurbulenceForce, Type =>
{
    return {
        type: "Tw2ParticleTurbulenceForce",
        category: "ParticleForce",
        props: {
            amplitude: Type.VECTOR3,
            frequency: Type.VECTOR4,
            noiseLevel: Type.NUMBER,
            noiseRatio: Type.NUMBER
        }
    };
});

