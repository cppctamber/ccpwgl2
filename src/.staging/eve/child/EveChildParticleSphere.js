import {Tw2StagingClass} from "../../class";

/**
 * EveChildParticleSphere
 * @implements ObjectChild
 *
 * @parameter {Array.<ParticleAttributeGenerator>} generators -
 * @parameter {Number} maxSpeed                               -
 * @parameter {Tw2InstancedMesh} mesh                         -
 * @parameter {Number} movementScale                          -
 * @parameter {Tw2ParticleSystem} particleSystem              -
 * @parameter {Number} positionShiftDecreaseSpeed             -
 * @parameter {Number} positionShiftIncreaseSpeed             -
 * @parameter {Number} positionShiftMax                       -
 * @parameter {Number} positionShiftMin                       -
 * @parameter {Number} radius                                 -
 * @parameter {Boolean} useSpaceObjectData                    -
 */
export default class EveChildParticleSphere extends Tw2StagingClass
{

    generators = [];
    maxSpeed = 0;
    mesh = null;
    movementScale = 0;
    particleSystem = null;
    positionShiftDecreaseSpeed = 0;
    positionShiftIncreaseSpeed = 0;
    positionShiftMax = 0;
    positionShiftMin = 0;
    radius = 0;
    useSpaceObjectData = false;

}

Tw2StagingClass.define(EveChildParticleSphere, Type =>
{
    return {
        type: "EveChildParticleSphere",
        category: "ObjectChild",
        props: {
            generators: [["Tw2RandomIntegerAttributeGenerator", "Tw2RandomUniformAttributeGenerator"]],
            maxSpeed: Type.NUMBER,
            mesh: ["Tw2InstancedMesh"],
            movementScale: Type.NUMBER,
            particleSystem: ["Tw2ParticleSystem"],
            positionShiftDecreaseSpeed: Type.NUMBER,
            positionShiftIncreaseSpeed: Type.NUMBER,
            positionShiftMax: Type.NUMBER,
            positionShiftMin: Type.NUMBER,
            radius: Type.NUMBER,
            useSpaceObjectData: Type.BOOLEAN
        }
    };
});

