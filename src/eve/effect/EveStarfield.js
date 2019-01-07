import {util} from "../../global";

/**
 * EveStarField - not implemented yet
 *
 * @property {String|number} _id
 * @property {String} name
 * @property {Boolean} display
 * @property {Tw2Effect} effect
 * @property {number} maxDist
 * @property {number} maxFlashRate
 * @property {number} minFlashIntensity
 * @property {number} minFlashRate
 * @property {number} seed
 */
export class EveStarfield
{

    _id = util.generateID();
    name = "";
    display = true;
    effect = null;
    maxDist = 0;
    maxFlashRate = 0;
    minFlashIntensity = 0;
    minFlashRate = 0;
    seed = 20;


    /**
     * Identifies that the object is not yet fully implemented
     * @type {Boolean}
     */
    static partialImplementation = true;

}