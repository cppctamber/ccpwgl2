import { meta } from "utils";
import { vec3 } from "math";
import { Tw2CurveExpression } from "./Tw2CurveExpression";


@meta.notImplemented
@meta.type("Tr2CurveVector3Expression")
export class Tr2CurveVector3Expression extends Tw2CurveExpression
{

    @meta.string
    name = "";

    @meta.list()
    inputs = [];

    @meta.expression
    expressionX = "";

    @meta.expression
    expressionY = "";

    @meta.expression
    expressionZ = "";

    @meta.vector3
    @meta.isPrivate
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

}
