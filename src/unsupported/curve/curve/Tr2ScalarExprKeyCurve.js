import { meta } from "utils";
import { Tw2Curve, Tw2CurveKey } from "curve";
import { Tr2ExpressionProgram } from "../../state/expression/Tr2ExpressionProgram";


/**
 * Expression-driven scalar curve key, transpiled from CarbonEngine
 * `trinity/Curves/Tr2ScalarExprKeyCurve.h/.cpp` (`Tr2ScalarExprKey`).
 *
 * Expressions for time, value, left tangent, and right tangent are compiled to
 * cached programs and re-evaluated against a snapshot of the key's variables
 * (`value`, `time`, `input1..input4`, `randomConstant`, `leftTangent`,
 * `rightTangent`, `prevKeyTime`, `prevKeyValue`), matching the native
 * `VariableBuffer` layout. `perlin`/`perlin_simple` remain hash-based
 * placeholders for the native PerlinNoise1D wrappers.
 */
@meta.type("Tr2ScalarExprKey")
@meta.ccp.define("Tr2ScalarExprKey")
export class Tr2ScalarExprKey extends Tw2CurveKey
{

    @meta.float
    input1 = -1;

    @meta.float
    input2 = -1;

    @meta.float
    input3 = -1;

    @meta.float
    input4 = 0;

    @meta.uint
    interpolation = 0;

    @meta.float
    left = 0;

    @meta.float
    right = 0;

    @meta.float
    time = 0;

    @meta.expression
    timeExpression = "";

    @meta.float
    @meta.isPrivate
    value = 0;

    valueExpression = "";
    leftTangentExpression = "";
    rightTangentExpression = "";

    randomMin = 0;
    randomMax = 0;
    randomConstant = 0;

    prevKeyTime = 0;
    prevKeyValue = 0;

    _timeProgram = null;
    _timeProgramSource = null;
    _valueProgram = null;
    _valueProgramSource = null;
    _leftTangentProgram = null;
    _leftTangentProgramSource = null;
    _rightTangentProgram = null;
    _rightTangentProgramSource = null;

    /**
     * Compiles expressions and regenerates the random constant (native Initialize)
     * @returns {Boolean}
     */
    Initialize()
    {
        this.CompilePrograms();
        this.RegenRandomConstant();
        return true;
    }

    /**
     * Ensures all four expression programs are compiled and cached
     */
    CompilePrograms()
    {
        this._timeProgram = CompileCached(this, "_timeProgram", "_timeProgramSource", this.timeExpression);
        this._valueProgram = CompileCached(this, "_valueProgram", "_valueProgramSource", this.valueExpression);
        this._leftTangentProgram = CompileCached(this, "_leftTangentProgram", "_leftTangentProgramSource", this.leftTangentExpression);
        this._rightTangentProgram = CompileCached(this, "_rightTangentProgram", "_rightTangentProgramSource", this.rightTangentExpression);
    }

    /**
     * Regenerates the key's random constant (native RegenRandomConstant)
     */
    RegenRandomConstant()
    {
        this.randomConstant = this.randomMin + Math.random() * (this.randomMax - this.randomMin);
    }

    /**
     * Updates data from the previous key and re-evaluates the key expressions
     * (native UpdateValues). All expressions read the same pre-update snapshot,
     * matching the native single VariableBuffer fill.
     * @param {?Tr2ScalarExprKey} previousKey
     */
    UpdateExpressionValues(previousKey)
    {
        if (previousKey)
        {
            this.prevKeyTime = previousKey.time;
            this.prevKeyValue = previousKey.value;
        }
        else
        {
            this.prevKeyTime = 0;
            this.prevKeyValue = 0;
        }

        this.CompilePrograms();

        const snapshot = {
            key: this,
            time: this.time,
            value: this.value,
            leftTangent: this.left,
            rightTangent: this.right,
            input1: this.input1,
            input2: this.input2,
            input3: this.input3,
            input4: this.input4,
            randomConstant: this.randomConstant,
            prevKeyTime: this.prevKeyTime,
            prevKeyValue: this.prevKeyValue
        };

        if (this.timeExpression && this._timeProgram && this._timeProgram.IsValid())
        {
            this.time = this._timeProgram.Evaluate(snapshot);
        }
        if (this.valueExpression && this._valueProgram && this._valueProgram.IsValid())
        {
            this.value = this._valueProgram.Evaluate(snapshot);
        }
        if (this.leftTangentExpression && this._leftTangentProgram && this._leftTangentProgram.IsValid())
        {
            this.left = this._leftTangentProgram.Evaluate(snapshot);
        }
        if (this.rightTangentExpression && this._rightTangentProgram && this._rightTangentProgram.IsValid())
        {
            this.right = this._rightTangentProgram.Evaluate(snapshot);
        }
    }

    /**
     * Native method name alias
     * @param {?Tr2ScalarExprKey} previousKey
     */
    UpdateValues(previousKey)
    {
        this.UpdateExpressionValues(previousKey);
    }

}


/**
 * Expression-key scalar curve, transpiled from CarbonEngine
 * `trinity/Curves/Tr2ScalarExprKeyCurve.h/.cpp`.
 *
 * Matches the native (deprecated, performance-insensitive) shape:
 * - `GetValueAt` re-evaluates key expressions every call (`ReEvaluateKeys`).
 * - Tangents are used RAW in the Hermite basis (NOT scaled by segment length,
 *   unlike the modern `Tr2CurveScalar`).
 * - Keys are kept in time order by `AddKey` insertion; deserialized keys are
 *   assumed ordered.
 * - The native cycle/reversed time rebasing mixes `front()->m_value` into time
 *   math; that is transcribed verbatim as a documented native quirk.
 */
@meta.type("Tr2ScalarExprKeyCurve")
@meta.ccp.define("Tr2ScalarExprKeyCurve")
export class Tr2ScalarExprKeyCurve extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.uint
    interpolation = 0;

    @meta.list("Tr2ScalarExprKey")
    keys = [];

    @meta.float
    currentValue = 0;

    reversed = false;
    cycle = false;
    timeOffset = 0;
    timeScale = 1;
    startTangent = 0;
    endTangent = 0;

    /**
     * Re-evaluates key expressions (native Initialize)
     * @returns {Boolean}
     */
    Initialize()
    {
        this.ReEvaluateKeys();
        return true;
    }

    /**
     * Native "Sort" is a curve-editor compatibility alias for ReEvaluateKeys
     */
    Sort()
    {
        this.ReEvaluateKeys();
    }

    /**
     * Re-evaluates all key expressions in order, feeding each key its predecessor
     */
    ReEvaluateKeys()
    {
        let previousKey = null;
        for (const key of this.keys)
        {
            key.UpdateExpressionValues(previousKey);
            previousKey = key;
        }
    }

    /**
     * Curve length in time (native Length)
     * @returns {Number}
     */
    Length()
    {
        if (!this.keys.length) return 0;
        return this.keys[this.keys.length - 1].time - this.keys[0].time;
    }

    GetLength()
    {
        return this.Length();
    }

    /**
     * Updates the curve's current value (native UpdateValue)
     * @param {Number} time
     */
    UpdateValue(time)
    {
        this.currentValue = this.GetValueAt(time);
    }

    /**
     * Computes the curve value at a given time (native GetValueAt)
     * @param {Number} time
     * @returns {Number}
     */
    GetValueAt(time)
    {
        if (!this.keys.length) return 0;

        this.ReEvaluateKeys();

        const length = this.Length();
        const front = this.keys[0];
        const back = this.keys[this.keys.length - 1];

        time = time / this.timeScale - this.timeOffset;

        if (length <= 0 || time <= 0)
        {
            return front.value;
        }

        if (time > length + front.time)
        {
            if (this.cycle)
            {
                // native quirk transcribed verbatim: uses front()->m_value (not m_time)
                // as the rebase origin for cycling; JS % matches C fmod semantics
                time = front.value + (time - front.value) % length;
            }
            else if (this.reversed)
            {
                return front.value;
            }
            else
            {
                return back.value;
            }
        }

        if (this.reversed)
        {
            // native quirk transcribed verbatim: same value/time mixing as above
            time = front.value + (length - (time - front.value));
        }

        let startKey = this.keys[0];
        let endKey = back;

        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey);
        }

        if (time >= endKey.time)
        {
            return this.Interpolate(time, endKey, null);
        }

        endKey = startKey;
        for (let i = 1; i < this.keys.length; i++)
        {
            startKey = endKey;
            endKey = this.keys[i];
            if (endKey.time > time) break;
        }
        return this.Interpolate(time, startKey, endKey);
    }

    /**
     * Interpolates between keys / curve endpoints (native Interpolate).
     * Tangents are used RAW (not scaled by segment length).
     * @param {Number} time
     * @param {?Tr2ScalarExprKey} lastKey
     * @param {?Tr2ScalarExprKey} nextKey
     * @returns {Number}
     */
    Interpolate(time, lastKey, nextKey)
    {
        let out = this.keys[0].value;
        let deltaTime = this.Length();
        let startValue = this.keys[0].value;
        let endValue = this.keys[this.keys.length - 1].value;
        let interp = this.interpolation;

        if (lastKey)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }

        switch (interp)
        {
            case 1: { // LINEAR
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    endValue = nextKey.value;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (!lastKey && nextKey)
                {
                    startValue = endValue = nextKey.value;
                    deltaTime = nextKey.time;
                }
                else if (lastKey && !nextKey)
                {
                    startValue = endValue = lastKey.value;
                    deltaTime = this.Length() - lastKey.time;
                }
                out = startValue + (endValue - startValue) * (time / deltaTime);
                break;
            }
            case 2: { // HERMITE
                let inTangent = 0;
                let outTangent = 0;
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.right;
                    endValue = nextKey.value;
                    outTangent = nextKey.left;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (!lastKey && nextKey)
                {
                    startValue = endValue = nextKey.value;
                    outTangent = nextKey.left;
                    deltaTime = nextKey.time;
                }
                else if (lastKey && !nextKey)
                {
                    startValue = endValue = lastKey.value;
                    inTangent = lastKey.right;
                    deltaTime = this.Length() - lastKey.time;
                }

                const s = time / deltaTime;
                const s2 = s * s;
                const s3 = s2 * s;
                const c2 = -2 * s3 + 3 * s2;
                const c1 = 1 - c2;
                const c4 = s3 - s2;
                const c3 = s + c4 - s2;

                out = startValue * c1 + endValue * c2 + inTangent * c3 + outTangent * c4;
                break;
            }
            default:
                break;
        }

        return out;
    }

    GetKeyCount()
    {
        return this.keys.length;
    }

    GetKeyValue(index)
    {
        return this.keys[index].value;
    }

    SetKeyValue(index, value)
    {
        this.keys[index].value = value;
    }

    GetKeyTime(index)
    {
        return this.keys[index].time;
    }

    SetKeyTime(index, time)
    {
        this.keys[index].time = time;
    }

    GetKeyInterpolation(index)
    {
        return this.keys[index].interpolation;
    }

    SetKeyInterpolation(index, interpolation)
    {
        this.keys[index].interpolation = interpolation;
    }

    GetKeyLeftTangent(index)
    {
        if (index < this.keys.length) return this.keys[index].left;
        return this.startTangent;
    }

    SetKeyLeftTangent(index, tangent)
    {
        if (index < this.keys.length) this.keys[index].left = tangent;
    }

    GetKeyRightTangent(index)
    {
        if (index < this.keys.length) return this.keys[index].right;
        return this.endTangent;
    }

    SetKeyRightTangent(index, tangent)
    {
        if (index < this.keys.length) this.keys[index].right = tangent;
    }

    /**
     * Inserts a key in time order and returns its index (native AddKey)
     * @param {Number} time
     * @param {Number} value
     * @param {Number} leftTangent
     * @param {Number} rightTangent
     * @param {Number} interpolation
     * @returns {Number}
     */
    AddKey(time, value, leftTangent, rightTangent, interpolation)
    {
        let index = 0;
        while (index < this.keys.length)
        {
            if (this.keys[index].time > time) break;
            index++;
        }

        const key = new Tr2ScalarExprKey();
        key.time = time;
        key.value = value;
        key.left = leftTangent;
        key.right = rightTangent;
        key.interpolation = interpolation;
        this.keys.splice(index, 0, key);
        return index;
    }

    RemoveKey(index)
    {
        this.keys.splice(index, 1);
    }

}


/**
 * Expression functions available to key expressions, matching the native
 * `s_functions` registration in Tr2ScalarExprKeyCurve.cpp. The perlin wrappers
 * are hash placeholders (native uses PerlinNoise1D).
 */
const KEY_EXPRESSION_FUNCTIONS = {
    perlin: (ctx, x, a, b, n) => Hash01(Number(x) || 0),
    perlin_simple: (ctx, x) => Hash01(Number(x) || 0)
};

function Hash01(value)
{
    const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function CompileCached(key, programField, sourceField, source)
{
    if (!source)
    {
        key[sourceField] = source;
        return null;
    }

    if (!key[programField] || key[sourceField] !== source)
    {
        key[programField] = Tr2ExpressionProgram.Compile(source, {
            emptyValue: 0,
            functions: KEY_EXPRESSION_FUNCTIONS
        });
        key[sourceField] = source;
    }
    return key[programField];
}
