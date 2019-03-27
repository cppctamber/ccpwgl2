import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataFactionChild
 *
 * @property {String} name
 * @property {Number} groupIndex -
 * @property {Boolean} isVisible -
 */
export class EveSOFDataFactionChild extends EveSOFBaseClass
{

    name = "";
    groupIndex = -1;
    isVisible = false;

}

EveSOFDataFactionChild.define(r =>
{
    return {
        type: "EveSOFDataFactionChild",
        black: [
            ["groupIndex", r.uint],
            ["name", r.string],
            ["isVisible", r.boolean]
        ]
    };
});