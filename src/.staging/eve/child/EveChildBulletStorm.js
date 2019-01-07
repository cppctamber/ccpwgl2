import {Tw2StagingClass} from "../../class";

/**
 * EveChildBulletStorm
 * @implements ObjectChild
 *
 * @parameter {Tw2Effect} effect        -
 * @parameter {Number} multiplier       -
 * @parameter {Number} range            -
 * @parameter {String} sourceLocatorSet -
 * @parameter {Number} speed            -
 */
export default class EveChildBulletStorm extends Tw2StagingClass
{

    effect = null;
    multiplier = 0;
    range = 0;
    sourceLocatorSet = "";
    speed = 0;

}

Tw2StagingClass.define(EveChildBulletStorm, Type =>
{
    return {
        type: "EveChildBulletStorm",
        category: "ObjectChild",
        props: {
            effect: ["Tw2Effect"],
            multiplier: Type.NUMBER,
            range: Type.NUMBER,
            sourceLocatorSet: Type.STRING,
            speed: Type.NUMBER
        }
    };
});

