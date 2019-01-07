import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullHazeSet
 *
 * @parameter {Array.<EveSOFDataHullHazeSetItem>} items -
 */
export default class EveSOFDataHullHazeSet extends Tw2StagingClass
{

    items = [];

}

Tw2StagingClass.define(EveSOFDataHullHazeSet, Type =>
{
    return {
        type: "EveSOFDataHullHazeSet",
        props: {
            items: [["EveSOFDataHullHazeSetItem"]]
        }
    };
});

