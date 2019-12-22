import { meta, vec2 } from "global";
import { Tw2CurveKey, Tw2Curve } from "../Tw2Curve";


const Interpolation = {
    CONSTANT: 0,
    LINEAR: 1,
    HERMITE: 2
};


@meta.type("Tw2Vector2Key")
export class Tw2Vector2Key extends Tw2CurveKey
{

    @meta.vector2
    value = vec2.create();

    @meta.vector2
    leftTangent = vec2.create();

    @meta.vector2
    rightTangent = vec2.create();

    @meta.enumerable(Interpolation)
    interpolation = 1;

}


@meta.type("Tw2Vector2Curve")
export class Tw2Vector2Curve extends Tw2Curve
{

    @meta.boolean
    cycle = false;

    @meta.boolean
    reversed = false;

    @meta.float
    timeOffset = 0;

    @meta.float
    timeScale = 1;

    @meta.vector2
    startValue = vec2.create();

    @meta.vector2
    @meta.isPrivate
    currentValue = vec2.create();

    @meta.vector2
    endValue = vec2.create();

    @meta.vector2
    startTangent = vec2.create();

    @meta.vector2
    endTangent = vec2.create();

    @meta.enumerable(Interpolation)
    interpolation = 1;

    @meta.listOf("Tw2Vector2Key")
    keys = [];

    @meta.float
    @meta.isPrivate
    length = 0;


    /**
     * Sorts the curve's keys
     */
    Sort()
    {
        Tw2Curve.Sort2(this);
    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return this.length;
    }

    /**
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec2} value - vec2 array
     * @returns {vec2} vec2 array
     * @prototype
     */
    GetValueAt(time, value)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            return vec2.copy(value, this.startValue);
        }

        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                return vec2.copy(value, this.startValue);
            }
            else
            {
                return vec2.copy(value, this.endValue);
            }
        }

        if (this.reversed)
        {
            time = this.length - time;
        }

        if (this.keys.length === 0)
        {
            return this.Interpolate(time, null, null, value);
        }

        let startKey = this.keys[0],
            endKey = this.keys[this.keys.length - 1];

        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey, value);
        }
        else if (time >= endKey.time)
        {
            return this.Interpolate(time, endKey, null, value);
        }

        for (let i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time) break;
        }

        return this.Interpolate(time, startKey, endKey, value);
    }

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2Vector2Key} lastKey
     * @param {Tw2Vector2Key} nextKey
     * @param {vec2} value - vec2 array
     * @returns {vec2} vec2 array
     */
    Interpolate(time, lastKey, nextKey, value)
    {
        vec2.copy(value, this.startValue);

        let startValue = this.startValue,
            endValue = this.endValue,
            interp = this.interpolation,
            deltaTime = this.length;

        if (lastKey !== null)
        {
            interp = lastKey.interpolation;
            time -= lastKey.time;
        }

        switch (interp)
        {
            case Interpolation.LINEAR:
                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    endValue = nextKey.value;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    deltaTime = this.length - lastKey.time;
                }
                value[0] = startValue[0] + (endValue[0] - startValue[0]) * (time / deltaTime);
                value[1] = startValue[1] + (endValue[1] - startValue[1]) * (time / deltaTime);
                return value;

            case Interpolation.HERMITE:
                let inTangent = this.startTangent,
                    outTangent = this.endTangent;

                if (lastKey && nextKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time - lastKey.time;
                }
                else if (nextKey)
                {
                    endValue = nextKey.value;
                    outTangent = nextKey.leftTangent;
                    deltaTime = nextKey.time;
                }
                else if (lastKey)
                {
                    startValue = lastKey.value;
                    inTangent = lastKey.rightTangent;
                    deltaTime = this.length - lastKey.time;
                }

                const
                    s = time / deltaTime,
                    s2 = s * s,
                    s3 = s2 * s;

                const
                    c2 = -2.0 * s3 + 3.0 * s2,
                    c1 = 1.0 - c2,
                    c4 = s3 - s2,
                    c3 = s + c4 - s2;

                value[0] = startValue[0] * c1 + endValue[0] * c2 + inTangent[0] * c3 + outTangent[0] * c4;
                value[1] = startValue[1] * c1 + endValue[1] * c2 + inTangent[1] * c3 + outTangent[1] * c4;
                return value;

            default:
                return value;
        }
    }

    /**
     * The curve's key dimension
     * @type {number}
     */
    static inputDimension = 2;

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 2;

    /**
     * The curve's current value property
     * @type {String}
     */
    static valueProperty = "value";

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE2;

    /**
     * The curve's key constructor
     * @type {Tw2Vector2Key}
     */
    static Key = Tw2Vector2Key;

    /**
     * Interpolation types
     * @type {*}
     */
    static Interpolation = Interpolation;

}
