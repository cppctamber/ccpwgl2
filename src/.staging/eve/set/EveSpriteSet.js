import {Tw2BaseClass} from "../../../global";

/**
 * EveSpriteSet
 * @implements EveObjectSet
 *
 * @property {Tr2Effect} effect                 -
 * @property {Number} intensity                 -
 * @property {Boolean} skinned                  -
 * @property {Array.<EveObjectSetItem>} sprites -
 */
export default class EveSpriteSet extends Tw2BaseClass
{

    effect = null;
    intensity = 0;
    skinned = false;
    sprites = [];

}

Tw2BaseClass.define(EveSpriteSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSpriteSet",
        category: "EveObjectSet",
        props: {
            effect: ["Tr2Effect"],
            intensity: Type.NUMBER,
            skinned: Type.BOOLEAN,
            sprites: [["EveSpriteSetItem"]]
        }
    };
});

