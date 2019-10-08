import { Tw2BaseClass } from "../../global";

/**
 * Tw2Float
 * @ccp Tw2Float
 *
 * @property {Number} value -
 */
export class Tw2Float extends Tw2BaseClass
{

    value = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "value", r.float ]
        ];
    }

}

