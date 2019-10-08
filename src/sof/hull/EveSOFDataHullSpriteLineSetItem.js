import { quat, vec3 } from "../../global";


/**
 * EveSOFDataHullSpriteLineSetItem
 *
 * @property {Number} blinkPhase      -
 * @property {Number} blinkPhaseShift -
 * @property {Number} blinkRate       -
 * @property {Number} boneIndex       -
 * @property {Number} colorType       -
 * @property {Number} falloff         -
 * @property {Number} intensity       -
 * @property {Boolean} isCircle       -
 * @property {Number} maxScale        -
 * @property {Number} minScale        -
 * @property {vec3} position          -
 * @property {quat} rotation          -
 * @property {vec3} scaling           -
 * @property {Number} spacing         -
 */
export class EveSOFDataHullSpriteLineSetItem
{

    blinkPhase = 0;
    blinkPhaseShift = 0;
    blinkRate = 0;
    boneIndex = -1;
    colorType = 0;
    falloff = 0;
    intensity = 0;
    isCircle = false;
    maxScale = 0;
    minScale = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    spacing = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "blinkRate", r.float ],
            [ "blinkPhase", r.float ],
            [ "blinkPhaseShift", r.float ],
            [ "boneIndex", r.uint ],
            [ "colorType", r.uint ],
            [ "falloff", r.float ],
            [ "groupIndex", r.uint ],
            [ "intensity", r.float ],
            [ "isCircle", r.boolean ],
            [ "maxScale", r.float ],
            [ "minScale", r.float ],
            [ "position", r.vector3 ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "spacing", r.float ]
        ];
    }
}
