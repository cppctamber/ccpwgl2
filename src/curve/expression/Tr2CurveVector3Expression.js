import { vec3 } from "../../global";
import { Tw2CurveExpression } from "./Tw2CurveExpression";

/**
 * Tr2CurveVector3Expression
 * TODO: Implement
 * @ccp Tr2CurveVector3Expression
 *
 * @property {String} expressionX -
 * @property {String} expressionY -
 * @property {String} expressionZ -
 */
export class Tr2CurveVector3Expression extends Tw2CurveExpression
{

    expressionX = "";
    expressionY = "";
    expressionZ = "";
    currentValue = vec3.create();

    /**
     * The expressions's curve input dimension
     * @type {number}
     */
    static inputDimension = 1;

    /**
     * The sequencer's output dimension
     * @type {number}
     */
    static outputDimension = 3;

    /**
     * The sequencer's current value property
     * @type {String}
     */
    static valueProperty = "currentValue";

    /**
     * The sequencer's curve property names
     * @type {?Array.<string>}
     */
    static childProperties = [ "expressionX", "expressionY", "expressionZ" ];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "inputs", r.array ],
            [ "name", r.string ],
            [ "expressionX", r.string ],
            [ "expressionY", r.string ],
            [ "expressionZ", r.string ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
