import {Tw2StagingClass} from "../../class";

/**
 * EveStarfield
 *
 * @parameter {Tw2Effect} effect         -
 * @parameter {Number} maxDist           -
 * @parameter {Number} maxFlashRate      -
 * @parameter {Number} minDist           -
 * @parameter {Number} minFlashIntensity -
 * @parameter {Number} minFlashRate      -
 * @parameter {Number} numStars          -
 * @parameter {Number} seed              -
 */
export default class EveStarfield extends Tw2StagingClass
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

Tw2StagingClass.define(EveStarfield, Type =>
{
    return {
        type: "EveStarfield",
        props: {
            effect: ["Tw2Effect"],
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

