import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2SphereShapeAttributeGenerator
 * @ccp Tr2SphereShapeAttributeGenerator
 * @implements ParticleAttributeGenerator
 *
 * @parameter {Number} distributionExponent -
 * @parameter {Number} maxPhi               -
 * @parameter {Number} maxRadius            -
 * @parameter {Number} maxSpeed             -
 * @parameter {Number} maxTheta             -
 * @parameter {Number} minPhi               -
 * @parameter {Number} minRadius            -
 * @parameter {Number} minSpeed             -
 * @parameter {Number} minTheta             -
 * @parameter {Number} parentVelocityFactor -
 * @parameter {vec3} position               -
 * @parameter {quat} rotation               -
 */
export default class Tw2SphereShapeAttributeGenerator extends Tw2StagingClass
{

    distributionExponent = 0;
    maxPhi = 0;
    maxRadius = 0;
    maxSpeed = 0;
    maxTheta = 0;
    minPhi = 0;
    minRadius = 0;
    minSpeed = 0;
    minTheta = 0;
    parentVelocityFactor = 0;
    position = vec3.create();
    rotation = quat.create();

}

Tw2StagingClass.define(Tw2SphereShapeAttributeGenerator, Type =>
{
    return {
        type: "Tw2SphereShapeAttributeGenerator",
        category: "ParticleAttributeGenerator",
        props: {
            distributionExponent: Type.NUMBER,
            maxPhi: Type.NUMBER,
            maxRadius: Type.NUMBER,
            maxSpeed: Type.NUMBER,
            maxTheta: Type.NUMBER,
            minPhi: Type.NUMBER,
            minRadius: Type.NUMBER,
            minSpeed: Type.NUMBER,
            minTheta: Type.NUMBER,
            parentVelocityFactor: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION
        }
    };
});

