import {Tw2StagingClass} from "../../class";

/**
 * EveLocatorSets
 * @implements EveObjectSet
 *
 * @parameter {Array} locators -
 */
export default class EveLocatorSets extends Tw2StagingClass
{

    locators = [];

}

Tw2StagingClass.define(EveLocatorSets, Type =>
{
    return {
        type: "EveLocatorSets",
        category: "EveObjectSet",
        props: {
            locators: Type.ARRAY
        }
    };
});

