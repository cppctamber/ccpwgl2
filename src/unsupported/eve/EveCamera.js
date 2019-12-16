import { meta, quat, vec3, Tw2BaseClass } from "global";


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
@meta.type("EveCamera", true)
export class EveCamera extends Tw2BaseClass
{

    @meta.black.float
    fieldOfView = 0;

    @meta.black.float
    friction = 0;

    @meta.black.float
    frontClip = 0;

    @meta.black.boolean
    idleMove = false;

    @meta.black.float
    idleScale = 0;

    @meta.black.float
    idleSpeed = 0;

    @meta.black.vector3
    intr = vec3.create();

    @meta.black.float
    maxSpeed = 0;

    @meta.black.float
    noiseScale = 0;

    @meta.black.object
    noiseScaleCurve = null;

    @meta.black.float
    pitch = 0;

    @meta.black.vector3
    pos = vec3.create();

    @meta.black.quaternion
    rotationAroundParent = quat.create();

    @meta.black.float
    translationFromParent = 0;

    @meta.black.float
    yaw = 0;

    @meta.black.object
    zoomCurve = null;

}
