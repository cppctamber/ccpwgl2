import { meta } from "utils";
import { Tw2Curve } from "curve";


@meta.ctor("Tw2CurveExpression")
export class Tw2CurveExpression extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.list()
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
