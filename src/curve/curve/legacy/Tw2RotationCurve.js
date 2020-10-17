import { meta } from "utils";
import { num, vec4, quat } from "math";
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
    LINEAR: 2,
    HERMITE: 3,
    SLERP: 5,
    SQUAD: 6
};


@meta.ctor("Tw2QuaternionKey")
export class Tw2QuaternionKey extends Tw2CurveKey
{

    @meta.quaternion
    @meta.isPrivate
    value = quat.create();

    @meta.vector4
    left = vec4.create();

    @meta.vector4
    right = vec4.create();

    @meta.enums(Interpolation)
    interpolation = 5;

}


@meta.ctor("Tw2RotationCurve")
export class Tw2RotationCurve extends Tw2Curve
{

    @meta.float
    start = 0;

    @meta.quaternion
    @meta.isPrivate
    value = quat.create();

    @meta.enums(Extrapolation)
    extrapolation = 0;

    @meta.list("Tw2QuaternionKey")
    keys = [];

    @meta.float
    @meta.isPrivate
    length = 0;


    _currentKey = 1;


    /**
     * Sorts the curve's children
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
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        if (this.length === 0)
        {
            return quat.copy(value, this.value);
        }

        const
            scratch = Tw2Curve.global,
            firstKey = this.keys[0],
            lastKey = this.keys[this.keys.length - 1];

        if (time >= lastKey.time)
        {
            switch (this.extrapolation)
            {
                case Extrapolation.NONE:
                    return quat.copy(value, this.value);

                case Extrapolation.CONSTANT:
                    return quat.copy(value, lastKey.value);

                default:
                    time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            switch (this.extrapolation)
            {
                case Extrapolation.NONE:
                    return quat.copy(value, this.value);

                default:
                    return quat.copy(value, firstKey.value);
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
                return quat.copy(value, ck_1.value);

            case Tw2RotationCurve.Interpolation.LINEAR:
                value[0] = ck_1.value[0] * (1 - nt) + ck.value[0] * nt;
                value[1] = ck_1.value[1] * (1 - nt) + ck.value[1] * nt;
                value[2] = ck_1.value[2] * (1 - nt) + ck.value[2] * nt;
                value[3] = ck_1.value[3] * (1 - nt) + ck.value[3] * nt;
                return value;

            case Interpolation.HERMITE:
                const
                    collect = quat.identity(scratch.quat_0),
                    arr = [ ck_1.value, ck_1.right, ck.left, ck.value ];

                for (let i = 3; i > 0; i--)
                {
                    const power = num.biCumulative(nt, i);
                    if (power > 1) quat.multiply(value, collect, arr[i]);
                    value[0] = -arr[i - 1][0];
                    value[1] = -arr[i - 1][1];
                    value[2] = -arr[i - 1][2];
                    value[3] = arr[i - 1][3];
                    quat.multiply(value, value, arr[i]);
                    quat.pow(value, value, power);
                    quat.multiply(collect, collect, value);
                }
                return quat.multiply(value, collect, ck_1.value);

            case Tw2RotationCurve.Interpolation.SLERP:
                return quat.slerp(value, ck_1.value, ck.value, nt);

            default:
                return quat.sqlerp(value, ck_1.value, ck_1.right, ck.left, ck.value, nt);
        }
    }


    /**
     * The curve's key dimension
     * @type {number}
     */
    static outputDimension = 4;

    /**
     * The curve's dimension
     * @type {number}
     */
    static inputDimension = 4;

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
     * @type {Tw2QuaternionKey}
     */
    static Child = Tw2QuaternionKey;

    /**
     * Extrapolation types
     * @type {{NONE: number, CONSTANT: number, GRADIENT: number, CYCLE: number}}
     */
    static Extrapolation = Extrapolation;

    /**
     * Interpolation types
     * @type {{NONE: number, CONSTANT: number, LINEAR: number, HERMITE: number, SLERP: number, SQUAD: number}}
     */
    static Interpolation = Interpolation;

}
