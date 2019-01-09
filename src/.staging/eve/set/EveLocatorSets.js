import {Tw2BaseClass} from "../../class";

/**
 * EveLocatorSets
 * @implements EveObjectSet
 *
 * @parameter {Array} locators -
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

