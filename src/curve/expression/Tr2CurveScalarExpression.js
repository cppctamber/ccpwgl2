import { Tw2CurveExpression } from "./Tw2CurveExpression";
import { meta } from "global/index";

/**
 * Tr2CurveScalarExpression
 *
 * @property {String} expression       -
 * @property {Number} input1           -
 * @property {Number} input2           -
 * @property {Number} input3           -
 */
@meta.notImplemented
@meta.type("Tr2CurveScalarExpression", true)
export class Tr2CurveScalarExpression extends Tw2CurveExpression
{

    @meta.black.string
    name = "";

    @meta.black.list
    inputs = [];

    @meta.black.expression
    expression = "";

    @meta.black.float
    @meta.todo("Figure out the default value")
    input1 = -1;

    @meta.black.float
    @meta.todo("Figure out the default value")
    input2 = -1;

    @meta.black.float
    @meta.todo("Figure out the default value")
    input3 = -1;

    @meta.float
    @meta.isPrivate
    currentValue = 0;

    /**
     * The expressions's curve input dimension
     * @type {number}
     */
    static inputDimension = 1;

    /**
     * The sequencer's output dimension
     * @type {number}
     */
    static outputDimension = 1;

    /**
     * The sequencer's current value property
     * @type {String}
     */
    static valueProperty = "currentValue";

    /**
     * The sequencer's curve property names
     * @type {?Array.<string>}
     */
    static childProperties = [ "expression" ];

}
