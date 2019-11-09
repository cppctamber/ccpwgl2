import { Tw2BaseClass } from "global";

/**
 * EveStretch2
 * TODO: Implement
 *
 * @property {String} name          -
 * @property {*} destinationEmitter -
 * @property {*} destinationLight   -
 * @property {Tw2Effect} effect     -
 * @property {TriCurveSet} loop     -
 * @property {*} sourceEmitter      -
 * @property {*} sourceLight        -
 * @property {Number} quadCount     -
 */
export class EveStretch2 extends Tw2BaseClass
{

    name = "";
    destinationEmitter = null;
    destinationLight = null;
    effect = null;
    loop = null;
    sourceEmitter = null;
    sourceLight = null;
    quadCount = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "destinationEmitter", r.object ],
            [ "destinationLight", r.object ],
            [ "effect", r.object ],
            [ "loop", r.object ],
            [ "name", r.string ],
            [ "sourceEmitter", r.object ],
            [ "sourceLight", r.object ],
            [ "quadCount", r.uint ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
