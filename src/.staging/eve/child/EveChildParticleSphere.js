import {Tw2BaseClass} from "../../class";

/**
 * EveChildParticleSphere
 * @implements ObjectChild
 *
 * @parameter {Array.<ParticleAttributeGenerator>} generators -
 * @parameter {Number} maxSpeed                               -
 * @parameter {Tr2InstancedMesh} mesh                         -
 * @parameter {Number} movementScale                          -
 * @parameter {Tr2ParticleSystem} particleSystem              -
 * @parameter {Number} positionShiftDecreaseSpeed             -
 * @parameter {Number} positionShiftIncreaseSpeed             -
 * @parameter {Number} positionShiftMax                       -
 * @parameter {Number} positionShiftMin                       -
 * @parameter {Number} radius                                 -
 * @parameter {Boolean} useSpaceObjectData                    -
 */
export default class EveChildParticleSphere extends Tw2BaseClass
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

Tw2BaseClass.define(EveChildParticleSphere, Type =>
{
    return {
        isStaging: true,
        type: "EveChildParticleSphere",
        category: "ObjectChild",
        props: {
            generators: [["Tr2RandomIntegerAttributeGenerator", "Tr2RandomUniformAttributeGenerator"]],
            maxSpeed: Type.NUMBER,
            mesh: ["Tr2InstancedMesh"],
            movementScale: Type.NUMBER,
            particleSystem: ["Tr2ParticleSystem"],
            positionShiftDecreaseSpeed: Type.NUMBER,
            positionShiftIncreaseSpeed: Type.NUMBER,
            positionShiftMax: Type.NUMBER,
            positionShiftMin: Type.NUMBER,
            radius: Type.NUMBER,
            useSpaceObjectData: Type.BOOLEAN
        }
    };
});

