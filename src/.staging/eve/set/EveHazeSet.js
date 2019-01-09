import {Tw2BaseClass} from "../../class";

/**
 * EveHazeSet
 * @implements EveObjectSet
 *
 * @parameter {EveObjectSetItem} items -
 */
export default class EveHazeSet extends Tw2BaseClass
{

    items = null;

}

Tw2BaseClass.define(EveHazeSet, Type =>
{
    return {
        isStaging: true,
        type: "EveHazeSet",
        category: "EveObjectSet",
        props: {
            items: ["EveHazeSetItem"]
        }
    };
});

