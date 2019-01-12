import {Tw2BaseClass} from "../../../global";

/**
 * EveHazeSet
 * @implements EveObjectSet
 *
 * @property {EveObjectSetItem} items -
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

