import {quat} from "../../global";
import {Tw2CurveExpression} from "./Tw2CurveExpression";
import {Tw2CurveSequencer} from "../sequencer";

/**
 * Tr2CurveEulerRotationExpression
 *
 * @property {String} expressionPitch                     -
 * @property {String} expressionRoll                      -
 * @property {String} expressionYaw                       -
 */
export class Tr2CurveEulerRotationExpression extends Tw2CurveExpression
{

    expressionPitch = "";
    expressionRoll = "";
    expressionYaw = "";
    currentValue = quat.create();

    /**
     * Updates the current value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

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
    static childProperties = ["expressionPitch", "expressionRoll", "expressionYaw"];


    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["inputs", r.array],
            ["name", r.string],
            ["expressionYaw", r.string],
            ["expressionPitch", r.string],
            ["expressionRoll", r.string],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}