import { Tw2CurveExpression } from "./Tw2CurveExpression";
import { meta } from "global/index";


@meta.notImplemented
@meta.ctor("Tr2CurveScalarExpression")
export class Tr2CurveScalarExpression extends Tw2CurveExpression
{

    @meta.string
    name = "";

    @meta.list()
    inputs = [];

    @meta.expression
    expression = "";

    @meta.float
    @meta.todo("Figure out the default value")
    input1 = -1;

    @meta.float
    @meta.todo("Figure out the default value")
    input2 = -1;

    @meta.float
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
