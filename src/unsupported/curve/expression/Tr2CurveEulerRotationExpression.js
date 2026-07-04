import { meta } from "utils";
import { quat } from "math";
import { Tw2CurveExpression } from "./Tw2CurveExpression";
import { Tr2ExpressionProgram } from "../../state/expression/Tr2ExpressionProgram";


@meta.type("Tr2CurveEulerRotationExpression")
@meta.ccp.define("Tr2CurveEulerRotationExpression")
export class Tr2CurveEulerRotationExpression extends Tw2CurveExpression
{

    @meta.string
    name = "";

    @meta.float
    input1 = 0;

    @meta.float
    input2 = 0;

    @meta.float
    input3 = 0;

    @meta.float
    input4 = 0;

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

    timeScale = 1;
    randomConstant = Math.random();

    _programs = [ null, null, null ];
    _programSources = [ null, null, null ];
    _evaluationTime = 0;

    /**
     * Compiles the cached component programs when required
     * @returns {Boolean}
     */
    Initialize()
    {
        this.CompileProgram(0);
        this.CompileProgram(1);
        this.CompileProgram(2);
        return true;
    }

    /**
     * Gets a component's expression source (0=yaw, 1=pitch, 2=roll)
     * @param {Number} index
     * @returns {String}
     */
    GetComponentExpression(index)
    {
        switch (index)
        {
            case 0:
                return this.expressionYaw;
            case 1:
                return this.expressionPitch;
            case 2:
                return this.expressionRoll;
            default:
                return "";
        }
    }

    /**
     * Gets a component's cached program, recompiling on source change
     * @param {Number} index
     * @returns {?Tr2ExpressionProgram} null when the component expression is empty
     */
    CompileProgram(index)
    {
        const source = this.GetComponentExpression(index);
        if (!source)
        {
            this._programs[index] = null;
            this._programSources[index] = source;
            return null;
        }

        if (!this._programs[index] || this._programSources[index] !== source)
        {
            this._programs[index] = Tr2ExpressionProgram.Compile(source, { emptyValue: 0 });
            this._programSources[index] = source;
        }
        return this._programs[index];
    }

    /**
     * Gets the per-instance random constant
     * @returns {Number}
     */
    GetRandomConstant()
    {
        return this.randomConstant;
    }

    /**
     * Gets an input curve's value
     * @param {Number} index
     * @param {Number} [time]
     * @returns {Number}
     */
    GetInputValue(index, time)
    {
        if (index < 0 || index >= this.inputs.length) return 0;
        const input = this.inputs[index];
        if (!input || typeof input.GetValueAt !== "function") return 0;
        const value = Number(input.GetValueAt(time === undefined ? this._evaluationTime : time));
        return Number.isFinite(value) ? value : 0;
    }

    /**
     * Gets the rotation quaternion at a given time (native GetValue)
     * @param {Number} time
     * @param {quat} [out]
     * @returns {quat}
     */
    GetValueAt(time, out = quat.create())
    {
        const scaledTime = time / this.timeScale;
        this._evaluationTime = scaledTime;

        const context = {
            curve: this,
            time: scaledTime,
            input1: this.input1,
            input2: this.input2,
            input3: this.input3,
            input4: this.input4
        };

        const angles = [ 0, 0, 0 ];
        for (let i = 0; i < 3; i++)
        {
            const program = this.CompileProgram(i);
            if (program && program.IsValid())
            {
                angles[i] = program.Evaluate(context);
            }
        }

        return RotationQuaternion(out, angles[0], angles[1], angles[2]);
    }

    /**
     * Updates and returns the current value
     * @param {Number} time
     * @param {quat} [out]
     * @returns {quat}
     */
    Update(time, out)
    {
        this.GetValueAt(time, this.currentValue);
        if (out)
        {
            quat.copy(out, this.currentValue);
            return out;
        }
        return this.currentValue;
    }

    /**
     * Updates the current value
     * @param {Number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Sets the runtime time scale
     * @param {Number} scale
     */
    ScaleTime(scale)
    {
        this.timeScale = scale;
    }

    /**
     * Expression curves have no key-based length
     * @returns {Number}
     */
    Length()
    {
        return 0;
    }

    /**
     * Expression curves have no key-based length
     * @returns {Number}
     */
    GetLength()
    {
        return 0;
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
    static childProperties = [ "expressionPitch", "expressionRoll", "expressionYaw" ];

}

/**
 * Yaw/pitch/roll to quaternion, transcribed from CarbonEngine
 * `math/src/Quaternion.cpp` RotationQuaternion(float yaw, float pitch, float roll)
 * (equivalent to XMQuaternionRotationRollPitchYaw(pitch, yaw, roll)).
 * @param {quat} out
 * @param {Number} yaw
 * @param {Number} pitch
 * @param {Number} roll
 * @returns {quat}
 */
function RotationQuaternion(out, yaw, pitch, roll)
{
    const sinYaw = Math.sin(yaw / 2);
    const cosYaw = Math.cos(yaw / 2);
    const sinPitch = Math.sin(pitch / 2);
    const cosPitch = Math.cos(pitch / 2);
    const sinRoll = Math.sin(roll / 2);
    const cosRoll = Math.cos(roll / 2);

    out[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
    out[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    return out;
}
