import {Tw2Curve} from "../curve";

/**
 * Tw2CurveExpression
 * Todo: Add expression engine
 * @ccp N/A
 *
 * @property {String} name
 * @property {Array} inputs
 */
export class Tw2CurveExpression extends Tw2Curve
{

    name = "";
    inputs = [];

    /**
     * Updates the current value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Curve type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.EXPRESSION;

}