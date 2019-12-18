import { meta } from "global";
import { Tw2Curve, Tw2CurveKey } from "curve";


@meta.type("Tw2CurveScalarKey")
export class Tw2CurveScalarKey extends Tw2CurveKey
{

    @meta.float
    endTangent = 0.0;

    @meta.uint
    extrapolation = 0;

    @meta.uint
    index = 0;

    @meta.uint
    interpolation = 1;

    @meta.float
    startTangent = 0.0;

    @meta.float
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


@meta.notImplemented
@meta.type("Tr2CurveScalar", true)
export class Tr2CurveScalar extends Tw2Curve
{

    @meta.black.string
    name = "";

    @meta.black.uint
    extrapolationAfter = 0;

    @meta.black.uint
    extrapolationBefore = 0;

    @meta.black.struct([ Tw2CurveScalarKey ])
    keys = [];

    @meta.black.float
    timeOffset = 0;

    @meta.black.float
    timeScale = 0;

    @meta.float
    @meta.isPrivate
    currentValue = 0;


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

}
