import {vec4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataFactionPlaneSet
 *
 * @property {String} name       -
 * @property {vec4} color        -
 * @property {Number} groupIndex -
 */
export class EveSOFDataFactionPlaneSet extends EveSOFBaseClass
{

    name = "";
    color = vec4.create();
    groupIndex = -1;

}

EveSOFDataFactionPlaneSet.define(r =>
{
    return {
        type: "EveSOFDataFactionPlaneSet",
        black: [
            ["color", r.vector4],
            ["groupIndex", r.uint],
            ["name", r.string],
        ]
    };
});