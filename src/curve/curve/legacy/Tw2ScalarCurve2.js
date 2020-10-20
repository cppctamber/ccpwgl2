import { meta } from "utils";
import { Tw2CurveKey, Tw2Curve } from "../Tw2Curve";


const Interpolation = {
    CONSTANT: 0,
    LINEAR: 1,
    HERMITE: 2
};


@meta.type("Tw2ScalarKey2")
export class Tw2ScalarKey2 extends Tw2CurveKey
{

    @meta.float
    value = 0;

    @meta.float
    leftTangent = 0;

    @meta.float
    rightTangent = 0;

    @meta.enums(Interpolation)
    interpolation = 1;

}


@meta.type("Tw2ScalarCurve2")
export class Tw2ScalarCurve2 extends Tw2Curve
{

    @meta.boolean
    cycle = false;

    @meta.boolean
    reversed = false;

    @meta.float
    timeOffset = 0;

    @meta.float
    timeScale = 1;

    @meta.float
    startValue = 0;

    @meta.float
    @meta.isPrivate
    currentValue = 0;

    @meta.float
    endValue = 0;

    @meta.float
    startTangent = 0;

    @meta.float
    endTangent = 0;

    @meta.enums(Interpolation)
    interpolation = 1;

    @meta.list("Tw2ScalarKey2")
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
        this.currentValue = this.GetValueAt(time);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     */
    GetValueAt(time)
    {
        time = time / this.timeScale + this.timeOffset;
        if (this.length <= 0 || time <= 0)
        {
            return this.startValue;
        }

        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                return this.startValue;
            }
            else
            {
                return this.endValue;
            }
        }

        if (this.reversed)
        {
            time = this.length - time;
        }

        if (this.keys.length === 0)
        {
            return this.Interpolate(time, null, null);
        }

        let startKey = this.keys[0],
            endKey = this.keys[this.keys.length - 1];

        if (time <= startKey.time)
        {
            return this.Interpolate(time, null, startKey);
        }
        else if (time >= endKey.time)
        {
            return this.Interpolate(time, endKey, null);
        }

        for (let i = 0; i + 1 < this.keys.length; ++i)
        {
            startKey = this.keys[i];
            endKey = this.keys[i + 1];
            if (startKey.time <= time && endKey.time > time) break;
        }

        return this.Interpolate(time, startKey, endKey);
    }

    /**
     * Interpolate
     * @param {number} time
     * @param {Tw2ScalarKey2} lastKey
     * @param {Tw2ScalarKey2} nextKey
     * @returns {number}
     */
    Interpolate(time, lastKey, nextKey)
    {
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
                return startValue + (endValue - startValue) * (time / deltaTime);

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

                return startValue * c1 + endValue * c2 + inTangent * c3 + outTangent * c4;

            default:
                return this.startValue;
        }
    }

    /**
     * The curve's key dimension
     * @type {number}
     */
    static inputDimension = 1;

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 1;

    /**
     * The curve's current value property
     * @type {String}
     */
    static valueProperty = "currentValue";

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE2;

    /**
     * The curve's key constructor
     * @type {Tw2ScalarKey2}
     */
    static Key = Tw2ScalarKey2;

    /**
     * Interpolation types
     * @type {{CONSTANT: number, LINEAR: number, HERMITE: number}}
     */
    static Interpolation = Interpolation;

}
