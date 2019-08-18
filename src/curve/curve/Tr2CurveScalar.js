import {Tw2Curve, Tw2CurveKey} from "./Tw2Curve";

/**
 * Tw2CurveScalarKey
 * @ccp N/A
 *
 * @param {Number} endTangent
 * @param {Number} extrapolation
 * @param {Number} index
 * @param {Number} interpolation
 * @param {Number} startTangent
 * @param {Number} value
 */
export class Tw2CurveScalarKey extends Tw2CurveKey
{

    endTangent = 0.0;
    extrapolation = 0;
    index = 0;
    interpolation = 1;
    startTangent = 0.0;
    value = 0.0;


    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     * @returns {Tw2CurveScalarKey}
     */
    static blackStruct(r)
    {
        const item = new this();
        item.time = r.ReadF32();
        item.value = r.ReadF32();
        item.startTangent = r.ReadF32();
        item.endTangent = r.ReadF32();
        item.index = r.ReadU16();
        item.interpolation = r.ReadU8();
        item.extrapolation = r.ReadU8();
        return item;
    }

}


/**
 * Tr2CurveScalar
 * TODO: implement extrapolationAfter
 * TODO: implement extrapolationBefore
 * TODO: implement timeOffset
 * TODO: implement timeScale
 * TODO: Get Extrapolation types from CCP
 * TODO: Get Interpolation types from CCP
 * TODO: implement GetValueAt
 * TODO: implement UpdateValue
 * @ccp Tr2CurveScalar
 *
 * @property {String} name                -
 * @property {Number} extrapolationAfter  -
 * @property {Number} extrapolationBefore -
 * @property {Array} keys                 -
 * @property {Number} timeOffset          -
 * @property {Number} timeScale           -
 */
export class Tr2CurveScalar extends Tw2Curve
{

    extrapolationAfter = 0;
    extrapolationBefore = 0;
    keys = [];
    timeOffset = 0;
    timeScale = 0;
    currentValue = 0;

    // ccpwgl
    _length = 0;

    /**
     * Sorts the curve
     */
    Sort()
    {
        this._length = Tw2Curve.Sort3(this.keys);
    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        // TODO: Does timeOffset and timeScale need to be considered here?
        return this._length;
    }

    /**
     * The curve's dimension
     * @type {?number}
     */
    static inputDimension = 1;

    /**
     * The curve's dimension
     * @type {?number}
     */
    static outputDimension = 1;

    /**
     * The curve's current value property
     * @type {?String}
     */
    static valueProperty = "currentValue";

    /**
     * The curve's type
     * @type {?number}
     */
    static curveType = Tw2Curve.Type.CURVE3;

    /**
     * The curve's Key constructor
     * @type {?Tw2CurveKey}
     */
    static Key = Tw2CurveScalarKey;

    /**
     * Interpolation types
     * @type {?{ string: number}}
     */
    static Interpolation = {};

    /**
     * Extrapolation types
     * @type {?{ string: number}}
     */
    static Extrapolation = {};

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["timeOffset", r.float],
            ["timeScale", r.float],
            ["extrapolationAfter", r.uint],
            ["extrapolationBefore", r.uint],
            ["keys", r.structList(Tw2CurveScalarKey)]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}