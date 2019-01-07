import {Tw2StagingClass} from "../../class";

/**
 * EveSpriteSet
 * @implements EveObjectSet
 *
 * @parameter {Tw2Effect} effect                 -
 * @parameter {Number} intensity                 -
 * @parameter {Boolean} skinned                  -
 * @parameter {Array.<EveObjectSetItem>} sprites -
 */
export default class EveSpriteSet extends Tw2StagingClass
{

    effect = null;
    intensity = 0;
    skinned = false;
    sprites = [];

}

Tw2StagingClass.define(EveSpriteSet, Type =>
{
    return {
        type: "EveSpriteSet",
        category: "EveObjectSet",
        props: {
            effect: ["Tw2Effect"],
            intensity: Type.NUMBER,
            skinned: Type.BOOLEAN,
            sprites: [["EveSpriteSetItem"]]
        }
    };
});

