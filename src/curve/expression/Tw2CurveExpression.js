import {Tw2BaseClass} from "../../global/class";

export function Tw2CurveExpression()
{
    Tw2BaseClass.defineID(this);
    this.name = "";
    this.inputs = [];
}

Tw2CurveExpression.prototype = Object.assign(Object.create(Tw2BaseClass.prototype), {

    constructor: Tw2CurveExpression,

});