import { meta, vec4 } from "global";
import { Tw2CurveKey, Tw2Curve } from "../Tw2Curve";


const Extrapolation = {
    NONE: 0,
    CONSTANT: 1,
    GRADIENT: 2,
    CYCLE: 3
};


const Interpolation = {
    NONE: 0,
    CONSTANT: 1,
    LINEAR: 2
};


@meta.ctor("Tw2ColorKey")
export class Tw2ColorKey extends Tw2CurveKey
{

    @meta.vector4
    value = vec4.create();

    @meta.vector4
    left = vec4.create();

    @meta.vector4
    right = vec4.create();

    @meta.enums(Interpolation)
    interpolation = 0;

}


@meta.ctor("Tw2ColorCurve")
export class Tw2ColorCurve extends Tw2Curve
{

    @meta.float
    start = 0;

    @meta.vector4
    @meta.isPrivate
    value = vec4.create();

    @meta.enums(Extrapolation)
    extrapolation = 0;

    @meta.list("Tw2ColorKey")
    keys = [];

    @meta.float
    @meta.isPrivate
    length = 0;

    _currentKey = 1;

    /**
     * Sorts the curve's keys
     */
    Sort()
    {
        Tw2Curve.Sort(this);
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
        this.GetValueAt(time, this.value);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec4} value
     * @returns {vec4} value
     */
    GetValueAt(time, value)
    {
        if (this.length === 0)
        {
            return vec4.copy(value, this.value);
        }

        const
            firstKey = this.keys[0],
            lastKey = this.keys[this.keys.length - 1];

        if (time >= lastKey.time)
        {
            switch (this.extrapolation)
            {
                case Extrapolation.NONE:
                    return vec4.copy(value, this.value);

                case Extrapolation.CONSTANT:
                    return vec4.copy(value, lastKey.value);

                case Extrapolation.GRADIENT:
                    return vec4.scaleAndAdd(value, lastKey.value, lastKey.right, time - lastKey.time);

                default:
                    time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            switch (this.extrapolation)
            {
                case Extrapolation.NONE:
                    return vec4.copy(value, this.value);

                case Extrapolation.GRADIENT:
                    return vec4.scaleAndAdd(value, firstKey.value, firstKey.left, time * this.length - lastKey.time);

                default:
                    return vec4.copy(value, firstKey.value);
            }
        }

        let ck = this.keys[this._currentKey],
            ck_1 = this.keys[this._currentKey - 1];

        while ((time >= ck.time) || (time < ck_1.time))
        {
            if (time < ck_1.time) this._currentKey = 0;
            this._currentKey++;
            ck = this.keys[this._currentKey];
            ck_1 = this.keys[this._currentKey - 1];
        }

        const nt = (time - ck_1.time) / (ck.time - ck_1.time);

        switch (ck_1.interpolation)
        {
            case Interpolation.CONSTANT:
                return vec4.copy(value, ck_1.value);

            default:
                value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
                value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
                value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
                value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
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
    static valueProperty = "value";

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE;

    /**
     * The curve's key constructor
     * @type {Tw2ColorKey}
     */
    static Key = Tw2ColorKey;

    /**
     * Extrapolation types
     * @type {{NONE: number, CONSTANT: number, GRADIENT: number, CYCLE: number}}
     */
    static Extrapolation = Extrapolation;

    /**
     * Interpolation types
     * @type {{NONE: number, CONSTANT: number, LINEAR: number}}
     */
    static Interpolation = Interpolation;

}
