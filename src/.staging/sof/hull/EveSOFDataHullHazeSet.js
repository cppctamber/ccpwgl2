import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataHullHazeSet
 *
 * @property {Array.<EveSOFDataHullHazeSetItem>} items -
 */
export default class EveSOFDataHullHazeSet extends Tw2BaseClass
{

    items = [];

}

Tw2BaseClass.define(EveSOFDataHullHazeSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullHazeSet",
        props: {
            items: [["EveSOFDataHullHazeSetItem"]]
        }
    };
});

