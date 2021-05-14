import { meta } from "utils";
import { quat } from "math";
import { Tw2CurveExpression } from "./Tw2CurveExpression";


@meta.notImplemented
@meta.type("Tr2CurveEulerRotationExpression")
export class Tr2CurveEulerRotationExpression extends Tw2CurveExpression
{

    @meta.string
    name = "";

    @meta.float
    input1 = 0;

    @meta.list()
    inputs = [];

    @meta.expression
    expressionPitch = "";

    @meta.expression
    expressionRoll = "";

    @meta.expression
    expressionYaw = "";

    @meta.quaternion
    @meta.isPrivate
    currentValue = quat.create();


    /**
     * The expressions's curve input dimension
     * @type {number}
     */
    static inputDimension = 1;

    /**
     * The sequencer's output dimension
     * @type {number}
     */
    static outputDimension = 4;

    /**
     * The sequencer's current value property
     * @type {String}
     */
    static valueProperty = "currentValue";

    /**
     * The sequencer's curve property names
     * @type {?Array.<string>}
     */
    static childProperties = [ "expressionPitch", "expressionRoll", "expressionYaw" ];


}
