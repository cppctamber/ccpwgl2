import {Tw2BaseClass} from "../../global/class";

export function Tw2CurveAdapter()
{
    Tw2BaseClass.defineID(this);
    this.name = "";
    this.curve = null;
    this.value = null;
}

Tw2CurveAdapter.prototype = Object.assign(Object.create(Tw2BaseClass.prototype), {

    constructor: Tw2CurveAdapter,

});