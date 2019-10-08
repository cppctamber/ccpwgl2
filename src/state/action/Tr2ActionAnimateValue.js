import { Tw2BaseClass } from "../../global";

/**
 * Tr2ActionAnimateValue
 * Todo: Implement
 *
 * @property {String} attribute               -
 * @property {Tr2CurveScalarExpression} curve -
 * @property {String} path                    -
 * @property {String} value                   -
 */
export class Tr2ActionAnimateValue extends Tw2BaseClass
{

    attribute = "";
    curve = null;
    path = "";
    value = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "attribute", r.string ],
            [ "curve", r.object ],
            [ "path", r.path ],
            [ "value", r.string ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
