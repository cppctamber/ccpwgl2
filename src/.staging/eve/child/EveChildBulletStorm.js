import {Tw2BaseClass} from "../../../global";

/**
 * EveChildBulletStorm
 * @implements ObjectChild
 *
 * @property {Tr2Effect} effect        -
 * @property {Number} multiplier       -
 * @property {Number} range            -
 * @property {String} sourceLocatorSet -
 * @property {Number} speed            -
 */
export default class EveChildBulletStorm extends Tw2BaseClass
{

    effect = null;
    multiplier = 0;
    range = 0;
    sourceLocatorSet = "";
    speed = 0;

}

Tw2BaseClass.define(EveChildBulletStorm, Type =>
{
    return {
        isStaging: true,
        type: "EveChildBulletStorm",
        category: "ObjectChild",
        props: {
            effect: ["Tr2Effect"],
            multiplier: Type.NUMBER,
            range: Type.NUMBER,
            sourceLocatorSet: Type.STRING,
            speed: Type.NUMBER
        }
    };
});

