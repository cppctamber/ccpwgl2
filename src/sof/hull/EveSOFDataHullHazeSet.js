import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullHazeSet
 *
 * @property {String} name                             -
 * @property {Array.<EveSOFDataHullHazeSetItem>} items -
 * @property {Number} visibilityGroup                  -
 */
export class EveSOFDataHullHazeSet extends EveSOFBaseClass
{

    name = "";
    items = [];
    visibilityGroup = 0;

}

EveSOFDataHullHazeSet.define(r =>
{
    return {
        type: "EveSOFDataHullHazeSet",
        black: [
            ["items", r.array],
            ["name", r.string],
            ["visibilityGroup", r.string]
        ]
    };
});