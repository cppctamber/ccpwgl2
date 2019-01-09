import {Tw2BaseClass} from "../../class";

/**
 * EveSpriteLineSet
 * @implements EveObjectSet
 *
 */
export default class EveSpriteLineSet extends Tw2BaseClass
{


}

Tw2BaseClass.define(EveSpriteLineSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSpriteLineSet",
        category: "EveObjectSet",
        props: {}
    };
});

