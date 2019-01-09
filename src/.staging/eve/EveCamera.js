import {quat, vec3} from "../../global";
import {Tw2BaseClass} from "../class";

/**
 * EveCamera
 *
 * @parameter {Number} fieldOfView             -
 * @parameter {Number} friction                -
 * @parameter {Number} frontClip               -
 * @parameter {Boolean} idleMove               -
 * @parameter {Number} idleScale               -
 * @parameter {Number} idleSpeed               -
 * @parameter {vec3} intr                      -
 * @parameter {Number} maxSpeed                -
 * @parameter {Number} noiseScale              -
 * @parameter {Tr2CurveScalar} noiseScaleCurve -
 * @parameter {Number} pitch                   -
 * @parameter {vec3} pos                       -
 * @parameter {quat} rotationAroundParent      -
 * @parameter {Number} translationFromParent   -
 * @parameter {Number} yaw                     -
 * @parameter {Tr2CurveScalar} zoomCurve       -
 */
export default class EveCamera extends Tw2BaseClass
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
        }
    };
});

