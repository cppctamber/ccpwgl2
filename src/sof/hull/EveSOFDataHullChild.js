import { quat, vec3 } from "../../global";


/**
 * EveSOFDataHullChild
 *
 * @property {String} name             -
 * @property {Number} groupIndex       -
 * @property {Number} id               -
 * @property {Number} lowestLodVisible -
 * @property {String} redFilePath      -
 * @property {quat} rotation           -
 * @property {vec3} scaling            -
 * @property {vec3} translation        -
 */
export class EveSOFDataHullChild
{

    name = "";
    groupIndex = -1;
    id = 0;
    lowestLodVisible = 0;
    redFilePath = "";
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    translation = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "groupIndex", r.uint ],
            [ "id", r.uint ],
            [ "lowestLodVisible", r.uint ],
            [ "name", r.string ],
            [ "redFilePath", r.path ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "translation", r.vector3 ]
        ];
    }
}
