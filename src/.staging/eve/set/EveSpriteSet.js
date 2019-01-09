import {Tw2BaseClass} from "../../class";

/**
 * EveSpriteSet
 * @implements EveObjectSet
 *
 * @parameter {Tr2Effect} effect                 -
 * @parameter {Number} intensity                 -
 * @parameter {Boolean} skinned                  -
 * @parameter {Array.<EveObjectSetItem>} sprites -
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

