import { meta } from "utils";
import { Tw2Curve, Tw2CurveKey } from "curve";


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
    CATMULROM: 4
};


@meta.type("Tw2CurveScalarKey")
@meta.todo("Figure out how this basic curve works!")
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
@meta.type("Tr2CurveScalar")
export class Tr2CurveScalar extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.uint
    extrapolationAfter = 0;

    @meta.uint
    extrapolationBefore = 0;

    @meta.list(Tw2CurveScalarKey)
    keys = [];

    @meta.float
    timeOffset = 0;

    @meta.float
    timeScale = 1;

    @meta.float
    @meta.isPrivate
    currentValue = 0;
    
    _currentKey = 1;
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
     * Updates the current value at a given time
     * @param {Number} time
     */
    UpdateValue(time)
    {
        this.currentValue = this.GetValueAt(time);
    }

    /**
     * Gets a value at the given time
     * @param {Number} time
     */
    GetValueAt(time)
    {
        time = time / this.timeScale - this.timeOffset;

        if (this._length === 0)
        {
            return this.currentValue;
        }

        const
            firstKey = this.keys[0],
            lastKey = this.keys[this.keys.length - 1];

        if (time >= lastKey.time)
        {
            switch (this.extrapolation)
            {
                case Extrapolation.NONE:
                    return this.value;

                case Extrapolation.CONSTANT:
                    return lastKey.value;

                case Extrapolation.GRADIENT:
                    return lastKey.value + (time - lastKey.time) * lastKey.right;

                default:
                    time = time % lastKey.time;
            }
        }
        else if (time < 0 || time < firstKey.time)
        {
            switch (this.extrapolation)
            {
                case Extrapolation.NONE:
                    return this.value;

                case Extrapolation.GRADIENT:
                    return firstKey.value + (time * this._length - lastKey.time) * firstKey.left;

                default:
                    return firstKey.value;
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
                return ck_1.value;

            case Interpolation.LINEAR:
                return ck_1.value * (1 - nt) + ck.value * nt;

            case Interpolation.HERMITE:
                const
                    k3 = 2 * nt * nt * nt - 3 * nt * nt + 1,
                    k2 = -2 * nt * nt * nt + 3 * nt * nt,
                    k1 = nt * nt * nt - 2 * nt * nt + nt,
                    k0 = nt * nt * nt - nt * nt;
                return k3 * ck_1.value + k2 * ck.value + k1 * ck_1.right + k0 * ck.left;

            default:
                const
                    sq = Math.sqrt(ck_1.value / ck.value),
                    exponent = Math.exp(-time / ck_1.right),
                    ret = (1.0 + (sq - 1.0) * exponent);
                return ret * ret * ck.value;
        }
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
     * @type {*}
     */
    static Interpolation = Interpolation;

    /**
     * Extrapolation types
     * @type {*}
     */
    static Extrapolation = Extrapolation;

}
