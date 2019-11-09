import { vec4 } from "global";


/**
 * EveSOFDataFactionSpotlightSet
 *
 * @property {String} name       -
 * @property {vec4} coneColor    -
 * @property {vec4} flareColor   -
 * @property {Number} groupIndex -
 * @property {vec4} spriteColor  -
 */
export class EveSOFDataFactionSpotlightSet
{

    name = "";
    coneColor = vec4.create();
    flareColor = vec4.create();
    groupIndex = -1;
    spriteColor = vec4.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "coneColor", r.vector4 ],
            [ "flareColor", r.vector4 ],
            [ "groupIndex", r.uint ],
            [ "name", r.string ],
            [ "spriteColor", r.vector4 ],
        ];
    }
}
