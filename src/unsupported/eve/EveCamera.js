import { meta } from "utils";
import { quat, vec3 } from "math";


/**
 * EveCamera
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
@meta.notImplemented
@meta.ctor("EveCamera", true)
export class EveCamera extends meta.Model
{

    @meta.float
    fieldOfView = 0;

    @meta.float
    friction = 0;

    @meta.float
    frontClip = 0;

    @meta.boolean
    idleMove = false;

    @meta.float
    idleScale = 0;

    @meta.float
    idleSpeed = 0;

    @meta.vector3
    intr = vec3.create();

    @meta.float
    maxSpeed = 0;

    @meta.float
    noiseScale = 0;

    @meta.struct()
    noiseScaleCurve = null;

    @meta.float
    pitch = 0;

    @meta.vector3
    pos = vec3.create();

    @meta.quaternion
    rotationAroundParent = quat.create();

    @meta.float
    translationFromParent = 0;

    @meta.float
    yaw = 0;

    @meta.struct()
    zoomCurve = null;

}
