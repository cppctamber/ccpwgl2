import {Tw2BaseClass} from "../../class";

/**
 * EveStarfield
 *
 * @parameter {Tr2Effect} effect         -
 * @parameter {Number} maxDist           -
 * @parameter {Number} maxFlashRate      -
 * @parameter {Number} minDist           -
 * @parameter {Number} minFlashIntensity -
 * @parameter {Number} minFlashRate      -
 * @parameter {Number} numStars          -
 * @parameter {Number} seed              -
 */
export default class EveStarfield extends Tw2BaseClass
{

    effect = null;
    maxDist = 0;
    maxFlashRate = 0;
    minDist = 0;
    minFlashIntensity = 0;
    minFlashRate = 0;
    numStars = 0;
    seed = 0;

}

Tw2BaseClass.define(EveStarfield, Type =>
{
    return {
        isStaging: true,
        type: "EveStarfield",
        props: {
            effect: ["Tr2Effect"],
            maxDist: Type.NUMBER,
            maxFlashRate: Type.NUMBER,
            minDist: Type.NUMBER,
            minFlashIntensity: Type.NUMBER,
            minFlashRate: Type.NUMBER,
            numStars: Type.NUMBER,
            seed: Type.NUMBER
        }
    };
});

