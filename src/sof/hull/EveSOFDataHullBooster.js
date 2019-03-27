import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullBooster
 *
 * @property {Boolean} alwaysOn                        -
 * @property {Boolean} hasTrails                       -
 * @property {Array.<EveSOFDataHullBoosterItem>} items -
 */
export class EveSOFDataHullBooster extends EveSOFBaseClass
{

    alwaysOn = false;
    hasTrails = false;
    items = [];

}

EveSOFDataHullBooster.define(r =>
{
    return {
        type: "EveSOFDataHullBooster",
        black: [
            ["alwaysOn", r.boolean],
            ["hasTrails", r.boolean],
            ["items", r.array]
        ]
    };
});