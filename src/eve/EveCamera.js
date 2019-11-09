import { quat, vec3, Tw2BaseClass } from "global";

/**
 * EveCamera
 * TODO: Implement
 * @ccp EveCamera
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "fieldOfView", r.float ],
            [ "friction", r.float ],
            [ "frontClip", r.float ],
            [ "idleMove", r.boolean ],
            [ "idleScale", r.float ],
            [ "idleSpeed", r.float ],
            [ "intr", r.vector3 ],
            [ "pitch", r.float ],
            [ "pos", r.vector3 ],
            [ "maxSpeed", r.float ],
            [ "noiseScale", r.float ],
            [ "noiseScaleCurve", r.object ],
            [ "rotationAroundParent", r.vector4 ],
            [ "translationFromParent", r.float ],
            [ "yaw", r.float ],
            [ "zoomCurve", r.object ]
        ];
    }

    static __isStaging = 4;

}
