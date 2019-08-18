/* eslint no-unused-vars:0 */
import {vec3, vec4, quat, Tw2BaseClass} from "../../global";
import {ErrAbstractClassMethod} from "../../core";

/**
 * Tw2CurveKey base class
 *
 * @property {number|String} _id
 * @property {String} name
 * @property {number} time
 */
export class Tw2CurveKey extends Tw2BaseClass
{

    name = "";
    time = 0;

}


/**
 * Tw2Curve base class
 *
 * @property {number|String} _id
 * @property {String} name
 */
export class Tw2Curve extends Tw2BaseClass
{

    name = "";

    /**
     * Initializes the Curve
     */
    Initialize()
    {
        this.Sort();
    }

    /**
     * Sorts the curve
     */
    Sort()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Compares curve keys
     * @param {Tw2CurveKey} a
     * @param {Tw2CurveKey} b
     * @returns {number}
     */
    static Compare(a, b)
    {
        if (a.time < b.time) return -1;
        if (a.time > b.time) return 1;
        return 0;
    }

    /**
     * Sorts legacy curve keys
     * @param {*} curve
     * @param {Array.<Tw2CurveKey>} [keys=curve.keys] - Optional keys override
     */
    static Sort(curve, keys = curve.keys)
    {
        if (keys && keys.length)
        {
            keys.sort(Tw2Curve.Compare);
            curve.length = keys[keys.length - 1].time;
        }
    }

    /**
     * Sorts curve keys
     * @param {*} curve
     */
    static Sort2(curve)
    {
        if (curve.keys && curve.keys.length)
        {
            curve.keys.sort(Tw2Curve.Compare);
            const back = curve.keys[curve.keys.length - 1];

            if (back.time > curve.length)
            {
                const
                    preLength = curve.length,
                    endValue = curve.endValue,
                    endTangent = curve.endTangent;

                curve.length = back.time;
                curve.endValue = back.value;
                curve.endTangent = back.leftTangent;

                if (preLength > 0)
                {
                    back.time = preLength;
                    back.value = endValue;
                    back.leftTangent = endTangent;
                }
            }
        }
    }

    /**
     * Sorts keys by time
     * @param {*} keys
     * @returns {number} length
     */
    static Sort3(keys)
    {
        keys.sort((a, b) =>
        {
            if (a.index < b.index) return -1;
            if (a.index > b.index) return 1;
            return 0;
        });

        let length = 0;
        for (let i = 0; i < keys.length; i++)
        {
            keys[i].index = i;
            if (i === keys.length - 1)
            {
                length = keys[i].time;
            }
        }
        return length;
    }

    /**
     * The curve's key dimension
     * @type {?number}
     */
    static inputDimension = null;

    /**
     * The curve's dimension
     * @type {?number}
     */
    static outputDimension = null;

    /**
     * The curve's current value property
     * @type {?String}
     */
    static valueProperty = null;

    /**
     * The curve's type
     * @type {?number}
     */
    static curveType = null;

    /**
     * The curve's Key constructor
     * @type {?Tw2CurveKey}
     */
    static Key = null;

    /**
     * Interpolation types
     * @type {?{ string: number}}
     */
    static Interpolation = null;

    /**
     * Extrapolation types
     * @type {?{ string: number}}
     */
    static Extrapolation = null;

    /**
     * Curve types
     * @type {{CURVE: number, CURVE2: number, CURVE3: number, CURVE_MAYA: number, SEQUENCER: number, SEQUENCER2: number}}
     */
    static Type = {
        CURVE: 1,
        CURVE2: 2,
        CURVE3: 3,
        CURVE_MAYA: 4,
        CURVE_NO_KEYS: 5,
        SEQUENCER: 100,
        SEQUENCER2: 101,
        EXPRESSION: 200,
        ADAPTER: 300
    };

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec4_0: vec4.create(),
        quat_0: quat.create(),
        quat_1: quat.create()
    };

}
