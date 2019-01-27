import {EveChild} from "./EveChild";

/**
 * EveChildParticleSphere
 * TODO: Implement
 * @ccp EveChildParticleSphere
 *
 * @property {Array.<Tw2ParticleAttributeGenerator>} generators -
 * @property {Number} maxSpeed                                  -
 * @property {Tw2InstancedMesh} mesh                            -
 * @property {Number} movementScale                             -
 * @property {Tw2ParticleSystem} particleSystem                 -
 * @property {Number} positionShiftDecreaseSpeed                -
 * @property {Number} positionShiftIncreaseSpeed                -
 * @property {Number} positionShiftMax                          -
 * @property {Number} positionShiftMin                          -
 * @property {Number} radius                                    -
 * @property {Boolean} useSpaceObjectData                       -
 */
export class EveChildParticleSphere extends EveChild
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

EveChild.define(EveChildParticleSphere, Type =>
{
    return {
        isStaging: true,
        type: "EveChildParticleSphere",
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
        },
        notImplemented: ["*"]
    };
});

