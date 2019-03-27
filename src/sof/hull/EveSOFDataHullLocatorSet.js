import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullLocatorSet
 *
 * @property {String} name                          -
 * @property {Array.<EveSOFDataTransform>} locators -
 */
export class EveSOFDataHullLocatorSet extends EveSOFBaseClass
{

    name = "";
    locators = [];

}

EveSOFDataHullLocatorSet.define(r =>
{
    return {
        type: "EveSOFDataHullLocatorSet",
        black: [
            ["name", r.string],
            ["locators", r.array]
        ]
    };
});