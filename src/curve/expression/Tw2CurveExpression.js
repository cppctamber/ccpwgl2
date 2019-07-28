import {Tw2BaseClass} from "../../global/class";
import {ErrAbstractClassMethod} from "../../core";
import {Tw2Curve} from "../curve";

export function Tw2CurveExpression()
{
    Tw2BaseClass.defineID(this);
    this.name = "";
    this.inputs = [];
}

Tw2CurveExpression.prototype = Object.assign(Object.create(Tw2BaseClass.prototype), {

    constructor: Tw2CurveExpression,

    /**
     * Updates values
     * @param {Number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    },

    /**
     * Gets a value at a given time
     * @param {Number} time
     * @param {*} value
     */
    GetValueAt(time, value)
    {
        throw new ErrAbstractClassMethod({feature: "GetValueAt"});
    }

});

/**
 * Curve type
 * @type {number}
 */
Tw2CurveExpression.curveType = Tw2Curve.Type.EXPRESSION;