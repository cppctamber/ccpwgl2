import {Tw2BaseClass} from "../../../global";

/**
 * EveSpriteLineSetItem
 * @implements EveObjectSetItem
 *
 */
export default class EveSpriteLineSetItem extends Tw2BaseClass
{


}

Tw2BaseClass.define(EveSpriteLineSetItem, Type =>
{
    return {
        isStaging: true,
        type: "EveSpriteLineSetItem",
        category: "EveObjectSetItem",
        props: {}
    };
});

