import {EveChild} from "./EveChild";

/**
 * EveChildBulletStorm
 * Todo: Implement
 * @ccp EveChildBulletStorm
 *
 * @property {Tw2Effect} effect        -
 * @property {Number} multiplier       -
 * @property {Number} range            -
 * @property {String} sourceLocatorSet -
 * @property {Number} speed            -
 */
export class EveChildBulletStorm extends EveChild
{
    // ccp
    effect = null;
    multiplier = 0;
    range = 0;
    sourceLocatorSet = "";
    speed = 0;

}

EveChild.define(EveChildBulletStorm, Type =>
{
    return {
        isStaging: true,
        type: "EveChildBulletStorm",
        props: {
            effect: ["Tw2Effect"],
            multiplier: Type.NUMBER,
            range: Type.NUMBER,
            sourceLocatorSet: Type.STRING,
            speed: Type.NUMBER
        },
        notImplemented: ["*"]
    };
});

