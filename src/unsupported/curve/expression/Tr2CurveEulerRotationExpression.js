import { meta, quat } from "global";
import { Tw2CurveExpression } from "./Tw2CurveExpression";


@meta.notImplemented
@meta.type("Tr2CurveEulerRotationExpression", true)
export class Tr2CurveEulerRotationExpression extends Tw2CurveExpression
{

    @meta.black.string
    name = "";

    @meta.black.list
    inputs = [];

    @meta.black.expression
    expressionPitch = "";

    @meta.black.expression
    expressionRoll = "";

    @meta.black.expression
    expressionYaw = "";

    @meta.black.quaternion
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
