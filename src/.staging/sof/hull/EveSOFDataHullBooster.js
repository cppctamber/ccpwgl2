import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataHullBooster
 *
 * @property {Boolean} alwaysOn                        -
 * @property {Boolean} hasTrails                       -
 * @property {Array.<EveSOFDataHullBoosterItem>} items -
 */
export default class EveSOFDataHullBooster extends Tw2BaseClass
{

    alwaysOn = false;
    hasTrails = false;
    items = [];

}

Tw2BaseClass.define(EveSOFDataHullBooster, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullBooster",
        props: {
            alwaysOn: Type.BOOLEAN,
            hasTrails: Type.BOOLEAN,
            items: [["EveSOFDataHullBoosterItem"]]
        }
    };
});

