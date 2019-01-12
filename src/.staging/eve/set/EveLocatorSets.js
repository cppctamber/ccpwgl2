import {Tw2BaseClass} from "../../../global";

/**
 * EveLocatorSets
 * @implements EveObjectSet
 *
 * @property {Array} locators -
 */
export default class EveLocatorSets extends Tw2BaseClass
{

    locators = [];

}

Tw2BaseClass.define(EveLocatorSets, Type =>
{
    return {
        isStaging: true,
        type: "EveLocatorSets",
        category: "EveObjectSet",
        props: {
            locators: Type.ARRAY
        }
    };
});

