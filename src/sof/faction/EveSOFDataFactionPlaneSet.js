import { vec4 } from "global";


/**
 * EveSOFDataFactionPlaneSet
 *
 * @property {String} name       -
 * @property {vec4} color        -
 * @property {Number} groupIndex -
 */
export class EveSOFDataFactionPlaneSet
{

    name = "";
    color = vec4.create();
    groupIndex = -1;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "color", r.vector4 ],
            [ "groupIndex", r.uint ],
            [ "name", r.string ],
        ];
    }
}
