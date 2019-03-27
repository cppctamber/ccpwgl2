import {vec4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataFactionSpotlightSet
 *
 * @property {String} name       -
 * @property {vec4} coneColor    -
 * @property {vec4} flareColor   -
 * @property {Number} groupIndex -
 * @property {vec4} spriteColor  -
 */
export class EveSOFDataFactionSpotlightSet extends EveSOFBaseClass
{

    name = "";
    coneColor = vec4.create();
    flareColor = vec4.create();
    groupIndex = -1;
    spriteColor = vec4.create();

}

EveSOFDataFactionSpotlightSet.define(r =>
{
    return {
        type: "EveSOFDataFactionSpotlightSet",
        black: [
            ["coneColor", r.vector4],
            ["flareColor", r.vector4],
            ["groupIndex", r.uint],
            ["name", r.string],
            ["spriteColor", r.vector4],
        ]
    };
});