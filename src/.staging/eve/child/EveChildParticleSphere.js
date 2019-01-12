import {Tw2BaseClass} from "../../../global";

/**
 * EveChildParticleSphere
 * @implements ObjectChild
 *
 * @property {Array.<ParticleAttributeGenerator>} generators -
 * @property {Number} maxSpeed                               -
 * @property {Tr2InstancedMesh} mesh                         -
 * @property {Number} movementScale                          -
 * @property {Tr2ParticleSystem} particleSystem              -
 * @property {Number} positionShiftDecreaseSpeed             -
 * @property {Number} positionShiftIncreaseSpeed             -
 * @property {Number} positionShiftMax                       -
 * @property {Number} positionShiftMin                       -
 * @property {Number} radius                                 -
 * @property {Boolean} useSpaceObjectData                    -
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

