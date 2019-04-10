import {Tw2BaseClass} from "../../global/index";

/**
 * Curve set range
 * @ccp Tr2CurveSetRange
 *
 * @property {String} name      -
 * @property {Number} endTime   -
 * @property {Boolean} looped   -
 * @property {Number} startTime -
 */
export class Tw2CurveSetRange extends Tw2BaseClass
{

    name = "";
    endTime = 0;
    looped = false;
    startTime = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["endTime", r.float],
            ["looped", r.boolean],
            ["name", r.string],
            ["startTime", r.float],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
