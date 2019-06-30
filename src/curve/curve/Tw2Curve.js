/* eslint no-unused-vars:0 */
import {vec3, vec4, quat, Tw2BaseClass} from "../../global";

/**
 * Tw2CurveKey base class
 *
 * @property {number|String} _id
 * @property {String} name
 * @property {number} time
 */
export function Tw2CurveKey()
{
    Tw2BaseClass.defineID(this);
    this.name = "";
    this.time = 0;
}

Tw2CurveKey.prototype = Object.assign(Object.create(Tw2BaseClass.prototype), {

    constructor: Tw2CurveKey,

});

/**
 * Tw2Curve base class
 *
 * @property {number|String} _id
 * @property {String} name
 */
export function Tw2Curve()
{
    Tw2BaseClass.defineID(this);
    this.name = "";
}

Tw2Curve.prototype = Object.assign(Object.create(Tw2BaseClass.prototype), {

    constructor: Tw2Curve,

    /**
     * Initializes the Curve
     */
    Initialize()
    {
        this.Sort();
    },

    /**
     * Sorts the curve
     */
    Sort()
    {

    },

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return 0;
    },

    /**
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {

    }

});

/**
 * Compares curve keys
 * @param {Tw2CurveKey} a
 * @param {Tw2CurveKey} b
 * @returns {number}
 */
Tw2Curve.Compare = function (a, b)
{
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    return 0;
};

/**
 * Sorts legacy curve keys
 * @param {*} curve
 * @param {Array.<Tw2CurveKey>} [keys=curve.keys] - Optional keys override
 */
Tw2Curve.Sort = function (curve, keys = curve.keys)
{
    if (keys && keys.length)
    {
        keys.sort(Tw2Curve.Compare);
        curve.length = keys[keys.length - 1].time;
    }
};

/**
 * Sorts curve keys
 * @param {*} curve
 */
Tw2Curve.Sort2 = function (curve)
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
};

/**
 *
 * @param keys
 * @returns {number}
 */
Tw2Curve.Sort3 = function(keys)
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
};

/**
 * The curve's key dimension
 * @type {?number}
 */
Tw2Curve.inputDimension = null;

/**
 * The curve's dimension
 * @type {?number}
 */
Tw2Curve.outputDimension = null;

/**
 * The curve's current value property
 * @type {?String}
 */
Tw2Curve.valueProperty = null;

/**
 * The curve's type
 * @type {?number}
 */
Tw2Curve.curveType = null;

/**
 * The curve's Key constructor
 * @type {?Tw2CurveKey}
 */
Tw2Curve.Key = null;

/**
 * Interpolation types
 * @type {?{ string: number}}
 */
Tw2Curve.Interpolation = null;

/**
 * Extrapolation types
 * @type {?{ string: number}}
 */
Tw2Curve.Extrapolation = null;

/**
 * Curve types
 * @type {{CURVE: number, CURVE2: number, CURVE3: number, CURVE_MAYA: number, SEQUENCER: number, SEQUENCER2: number}}
 */
Tw2Curve.Type = {
    CURVE: 1,
    CURVE2: 2,
    CURVE3: 3,
    CURVE_MAYA: 4,
    CURVE_NO_KEYS: 5,
    SEQUENCER: 100,
    SEQUENCER2: 101,
};

/**
 * Global and scratch variables
 * @type {*}
 */
Tw2Curve.global = {
    vec3_0: vec3.create(),
    vec4_0: vec4.create(),
    quat_0: quat.create(),
    quat_1: quat.create()
};
