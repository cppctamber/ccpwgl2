import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullLocatorSet
 *
 * @parameter {Array.<EveSOFDataTransform>} locators -
 */
export default class EveSOFDataHullLocatorSet extends Tw2StagingClass
{

    locators = [];

}

Tw2StagingClass.define(EveSOFDataHullLocatorSet, Type =>
{
    return {
        type: "EveSOFDataHullLocatorSet",
        props: {
            locators: [["EveSOFDataTransform"]]
        }
    };
});

