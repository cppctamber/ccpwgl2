import { Tw2CurveExpression } from "./Tw2CurveExpression";
import { meta } from "utils";
import { Tr2ExpressionProgram } from "../../state/expression/Tr2ExpressionProgram";


@meta.type("Tr2CurveScalarExpression")
@meta.ccp.define("Tr2CurveScalarExpression")
export class Tr2CurveScalarExpression extends Tw2CurveExpression
{

    @meta.string
    name = "";

    @meta.list()
    inputs = [];

    @meta.expression
    expression = "";

    @meta.float
    input1 = 0;

    @meta.float
    input2 = 0;

    @meta.float
    input3 = 0;

    @meta.float
    input4 = 0;

    @meta.float
    @meta.isPrivate
    currentValue = 0;

    timeScale = 1;
    randomConstant = Math.random();

    _program = null;
    _programSource = null;
    _evaluationTime = 0;

    /**
     * Compiles the cached expression program when required
     * @returns {Boolean}
     */
    Initialize()
    {
        if (this.expression) this.CompileProgram();
        return true;
    }

    /**
     * Gets the cached program, recompiling only when the source string changed
     * @returns {Tr2ExpressionProgram}
     */
    CompileProgram()
    {
        if (!this._program || this._programSource !== this.expression)
        {
            this._program = Tr2ExpressionProgram.Compile(this.expression, { emptyValue: 0 });
            this._programSource = this.expression;
        }
        return this._program;
    }

    /**
     * Gets the compile error for the current expression, if any
     * @returns {String}
     */
    GetExpressionError()
    {
        return this.expression ? this.CompileProgram().error || "" : "";
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
     * Resets the per-instance random constant (native ResetRandomConstant)
     */
    ResetRandomConstant()
    {
        this.randomConstant = Math.random();
    }

    /**
     * Gets an input curve's value (native GetInputValue)
     * @param {Number} index
     * @param {Number} [time] - defaults to the current evaluation time
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
     * Gets the expression value at a given time (native GetValue)
     * @param {Number} time
     * @returns {Number}
     */
    GetValue(time)
    {
        if (!this.expression) return 0;

        const program = this.CompileProgram();
        if (!program.IsValid()) return 0;

        const scaledTime = time / this.timeScale;
        this._evaluationTime = scaledTime;

        return program.Evaluate({
            curve: this,
            time: scaledTime,
            input1: this.input1,
            input2: this.input2,
            input3: this.input3,
            input4: this.input4
        });
    }

    /**
     * Gets the expression value at a given time
     * @param {Number} time
     * @returns {Number}
     */
    GetValueAt(time)
    {
        return this.GetValue(time);
    }

    /**
     * Updates and returns the current value
     * @param {Number} time
     * @returns {Number}
     */
    Update(time)
    {
        this.currentValue = this.GetValue(time);
        return this.currentValue;
    }

    /**
     * Updates the current value
     * @param {Number} time
     */
    UpdateValue(time)
    {
        this.currentValue = this.GetValue(time);
    }

    /**
     * Sets the runtime time scale (native ScaleTime)
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
