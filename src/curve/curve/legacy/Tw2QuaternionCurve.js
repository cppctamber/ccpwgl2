import { meta, vec4, quat } from "global";
import { Tw2CurveKey, Tw2Curve } from "../Tw2Curve";


const Interpolation = {
    CONSTANT: 0,
    SPHERICAL_LINEAR: 4
};


@meta.type("Tw2QuaternionKey2")
export class Tw2QuaternionKey2 extends Tw2CurveKey
{

    @meta.quaternion
    value = quat.create();

    @meta.vector4
    leftTangent = vec4.create();

    @meta.vector4
    rightTangent = vec4.create();

    @meta.enumerable(Interpolation)
    interpolation = 1;

}


@meta.type("Tw2QuaternionCurve")
export class Tw2QuaternionCurve extends Tw2Curve
{

    @meta.boolean
    cycle = false;

    @meta.boolean
    reversed = false;

    @meta.float
    timeOffset = 0;

    @meta.float
    timeScale = 1;

    @meta.quaternion
    startValue = quat.create();

    @meta.quaternion
    @meta.isPrivate
    currentValue = quat.create();

    @meta.quaternion
    endValue = quat.create();

    @meta.vector4
    startTangent = vec4.create();

    @meta.vector4
    endTangent = vec4.create();

    @meta.enumerable(Interpolation)
    interpolation = 1;

    @meta.listOf("Tw2QuaternionKey")
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
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        time = time / this.timeScale + this.timeOffset;

        if (this.length <= 0 || time <= 0)
        {
            value[0] = this.startValue[0];
            value[1] = this.startValue[1];
            value[2] = this.startValue[2];
            return value;
        }

        if (time > this.length)
        {
            if (this.cycle)
            {
                time = time % this.length;
            }
            else if (this.reversed)
            {
                value[0] = this.startValue[0];
                value[1] = this.startValue[1];
                value[2] = this.startValue[2];
                return value;
            }
            else
            {
                value[0] = this.endValue[0];
                value[1] = this.endValue[1];
                value[2] = this.endValue[2];
                return value;
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
     * @param {null|Tw2QuaternionKey} lastKey
     * @param {null|Tw2QuaternionKey} nextKey
     * @param {quat} value
     * @returns {*}
     */
    Interpolate(time, lastKey, nextKey, value)
    {
        value[0] = this.startValue[0];
        value[1] = this.startValue[1];
        value[2] = this.startValue[2];

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
            case Interpolation.SPHERICAL_LINEAR:
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

                quat.slerp(value, startValue, endValue, time / deltaTime);
                return value;

            default:
                return value;
        }
    }

    /**
     * The curve's key dimension
     * @type {number}
     */
    static inputDimension = 4;

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 4;

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
     * @type {Tw2QuaternionKey2}
     */
    static Key = Tw2QuaternionKey2;

    /**
     * Interpolation types
     * @type {{CONSTANT: number, SPHERICAL_LINEAR: number}}
     */
    static Interpolation = Interpolation;

}
