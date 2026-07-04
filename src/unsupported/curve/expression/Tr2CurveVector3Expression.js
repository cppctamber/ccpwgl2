import { meta } from "utils";
import { vec3 } from "math";
import { Tw2CurveExpression } from "./Tw2CurveExpression";
import { Tr2ExpressionProgram } from "../../state/expression/Tr2ExpressionProgram";


@meta.type("Tr2CurveVector3Expression")
@meta.ccp.define("Tr2CurveVector3Expression")
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

    @meta.float
    input1 = 0;

    @meta.float
    input2 = 0;

    @meta.float
    input3 = 0;

    @meta.float
    input4 = 0;

    @meta.vector3
    @meta.isPrivate
    currentValue = vec3.create();

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
     * Gets a component's expression source (0=x, 1=y, 2=z)
     * @param {Number} index
     * @returns {String}
     */
    GetComponentExpression(index)
    {
        switch (index)
        {
            case 0:
                return this.expressionX;
            case 1:
                return this.expressionY;
            case 2:
                return this.expressionZ;
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
     * Gets the vector value at a given time (native GetValue)
     * @param {Number} time
     * @param {vec3} [out]
     * @returns {vec3}
     */
    GetValueAt(time, out = vec3.create())
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

        for (let i = 0; i < 3; i++)
        {
            const program = this.CompileProgram(i);
            out[i] = program && program.IsValid() ? program.Evaluate(context) : 0;
        }
        return out;
    }

    /**
     * Updates and returns the current value
     * @param {Number} time
     * @param {vec3} [out]
     * @returns {vec3}
     */
    Update(time, out)
    {
        this.GetValueAt(time, this.currentValue);
        if (out)
        {
            vec3.copy(out, this.currentValue);
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
