import {Tw2BaseClass} from "../../class";

/**
 * EveChildBulletStorm
 * @implements ObjectChild
 *
 * @parameter {Tr2Effect} effect        -
 * @parameter {Number} multiplier       -
 * @parameter {Number} range            -
 * @parameter {String} sourceLocatorSet -
 * @parameter {Number} speed            -
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

