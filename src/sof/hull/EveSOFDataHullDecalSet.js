import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullDecalSet
 * @ccp EveSOFDataHullDecalSet
 *
 * @property {String} name
 * @property {Array<EveSOFDataHullDecalSetItem>} items
 * @property {String} visibilityGroup
 */
export class EveSOFDataHullDecalSet extends EveSOFBaseClass
{

    name = "";
    items = [];
    visibilityGroup = "";

}

EveSOFDataHullDecalSet.define(r =>
{
    return {
        type: "EveSOFDataHullDecalSet",
        black: [
            ["name", r.string],
            ["items", r.array],
            ["visibilityGroup", r.string]
        ]
    };
});