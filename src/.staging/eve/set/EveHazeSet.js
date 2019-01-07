import {Tw2StagingClass} from "../../class";

/**
 * EveHazeSet
 * @implements EveObjectSet
 *
 * @parameter {EveObjectSetItem} items -
 */
export default class EveHazeSet extends Tw2StagingClass
{

    items = null;

}

Tw2StagingClass.define(EveHazeSet, Type =>
{
    return {
        type: "EveHazeSet",
        category: "EveObjectSet",
        props: {
            items: ["EveHazeSetItem"]
        }
    };
});

