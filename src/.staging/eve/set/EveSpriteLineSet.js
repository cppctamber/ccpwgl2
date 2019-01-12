import {Tw2BaseClass} from "../../../global";

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

