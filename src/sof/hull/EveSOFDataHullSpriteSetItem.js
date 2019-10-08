import { vec3 } from "../../global";


/**
 * EveSOFDataHullSpriteSetItem
 *
 * @property {Number} blinkPhase -
 * @property {Number} blinkRate  -
 * @property {Number} boneIndex  -
 * @property {Number} colorType  -
 * @property {Number} falloff    -
 * @property {Number} intensity  -
 * @property {Number} maxScale   -
 * @property {Number} minScale   -
 * @property {vec3} position     -
 */
export class EveSOFDataHullSpriteSetItem
{

    blinkPhase = 0;
    blinkRate = 0;
    boneIndex = -1;
    colorType = 0;
    falloff = 0;
    intensity = 0;
    maxScale = 0;
    minScale = 0;
    position = vec3.create();

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
            [ "boneIndex", r.uint ],
            [ "colorType", r.uint ],
            [ "falloff", r.float ],
            [ "groupIndex", r.uint ],
            [ "intensity", r.float ],
            [ "maxScale", r.float ],
            [ "minScale", r.float ],
            [ "position", r.vector3 ]
        ];
    }
}
