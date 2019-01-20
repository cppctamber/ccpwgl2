import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullLocatorSet
 *
 * @property {Array.<EveSOFDataTransform>} locators -
 */
export default class EveSOFDataHullLocatorSet extends Tw2BaseClass
{

    locators = [];

}

Tw2BaseClass.define(EveSOFDataHullLocatorSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullLocatorSet",
        props: {
            locators: [["EveSOFDataTransform"]]
        }
    };
});

