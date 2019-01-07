import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullBooster
 *
 * @parameter {Boolean} alwaysOn                        -
 * @parameter {Boolean} hasTrails                       -
 * @parameter {Array.<EveSOFDataHullBoosterItem>} items -
 */
export default class EveSOFDataHullBooster extends Tw2StagingClass
{

    alwaysOn = false;
    hasTrails = false;
    items = [];

}

Tw2StagingClass.define(EveSOFDataHullBooster, Type =>
{
    return {
        type: "EveSOFDataHullBooster",
        props: {
            alwaysOn: Type.BOOLEAN,
            hasTrails: Type.BOOLEAN,
            items: [["EveSOFDataHullBoosterItem"]]
        }
    };
});

