import {quat, vec3, Tw2BaseClass} from "../global";

/**
 * EveCamera
 * @ccp EveCamera
 * TODO: Implement
 *
 * @property {Number} fieldOfView             -
 * @property {Number} friction                -
 * @property {Number} frontClip               -
 * @property {Boolean} idleMove               -
 * @property {Number} idleScale               -
 * @property {Number} idleSpeed               -
 * @property {vec3} intr                      -
 * @property {Number} maxSpeed                -
 * @property {Number} noiseScale              -
 * @property {Tr2CurveScalar} noiseScaleCurve -
 * @property {Number} pitch                   -
 * @property {vec3} pos                       -
 * @property {quat} rotationAroundParent      -
 * @property {Number} translationFromParent   -
 * @property {Number} yaw                     -
 * @property {Tr2CurveScalar} zoomCurve       -
 */
export class EveCamera extends Tw2BaseClass
{

    fieldOfView = 0;
    friction = 0;
    frontClip = 0;
    idleMove = false;
    idleScale = 0;
    idleSpeed = 0;
    intr = vec3.create();
    maxSpeed = 0;
    noiseScale = 0;
    noiseScaleCurve = null;
    pitch = 0;
    pos = vec3.create();
    rotationAroundParent = quat.create();
    translationFromParent = 0;
    yaw = 0;
    zoomCurve = null;

}

Tw2BaseClass.define(EveCamera, Type =>
{
    return {
        isStaging: true,
        type: "EveCamera",
        props: {
            fieldOfView: Type.NUMBER,
            friction: Type.NUMBER,
            frontClip: Type.NUMBER,
            idleMove: Type.BOOLEAN,
            idleScale: Type.NUMBER,
            idleSpeed: Type.NUMBER,
            intr: Type.VECTOR3,
            maxSpeed: Type.NUMBER,
            noiseScale: Type.NUMBER,
            noiseScaleCurve: ["Tr2CurveScalar"],
            pitch: Type.NUMBER,
            pos: Type.VECTOR3,
            rotationAroundParent: Type.TR_ROTATION,
            translationFromParent: Type.NUMBER,
            yaw: Type.NUMBER,
            zoomCurve: ["Tr2CurveScalar"]
        },
        notImplemented: ["*"]
    };
});

