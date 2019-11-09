import { quat, vec3 } from "global";


/**
 * EveSOFDataHullHazeSetItem
 *
 * @property {Boolean} boosterGainInfluence -
 * @property {Number} colorType             -
 * @property {Number} hazeBrightness        -
 * @property {Number} hazeFalloff           -
 * @property {vec3} position                -
 * @property {quat} rotation                -
 * @property {vec3} scaling                 -
 * @property {Number} sourceBrightness      -
 * @property {Number} sourceSize            -
 */
export class EveSOFDataHullHazeSetItem
{

    boosterGainInfluence = false;
    colorType = 0;
    hazeBrightness = 0;
    hazeFalloff = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sourceBrightness = 0;
    sourceSize = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "boosterGainInfluence", r.boolean ],
            [ "colorType", r.uint ],
            [ "hazeBrightness", r.float ],
            [ "hazeFalloff", r.float ],
            [ "position", r.vector3 ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "sourceBrightness", r.float ],
            [ "sourceSize", r.float ],
        ];
    }
}
