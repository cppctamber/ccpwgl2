import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullLightSet
 * @ccp EveSOFDataHullLightSet
 *
 * @property {String} name
 * @property {Array<EveSOFDataHullLightSetItem>} items
 */
export class EveSOFDataHullLightSet extends EveSOFBaseClass
{

    name = "";
    items = [];

}

EveSOFDataHullLightSet.define(r =>
{
    return {
        type: "EveSOFDataHullLightSet",
        black: [
            ["name", r.string],
            ["items", r.array],
        ]
    };
});