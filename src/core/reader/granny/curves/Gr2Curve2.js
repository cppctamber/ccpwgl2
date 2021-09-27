import { meta } from "utils";
import { Tw2GeometryCurve } from "core/geometry";
import { ErrFeatureNotImplemented, Tw2Error } from "core/Tw2Error";


@meta.type("Gr2Curve2")
export class Gr2Curve2
{

    @meta.uint
    dimension = -1;

    @meta.uint
    degree = 0;


    /**
     * Gets the curve's duration
     * @return {Number}
     */
    GetDuration()
    {
        return this.GetKnots()[this.GetKnotCount() - 1];
    }

    /**
     * Gets the knot count
     * @returns {Number}
     */
    @meta.abstract
    GetKnotCount()
    {

    }

    /**
     * Gets knots
     * @returns {Float32Array}
     */
    @meta.abstract
    GetKnots()
    {

    }

    /**
     * Gets points
     * returns {Float32Array}
     */
    GetVec3Buffer()
    {
        throw new ErrGr2CurveDataVec3NotSupported();
    }

    /**
     * Gets quaternions
     * returns {Float32Array}
     */
    GetQuatBuffer()
    {
        throw new ErrGr2CurveDataQuatNotSupported();
    }

    /**
     * Gets matrices
     * returns {Float32Array}
     */
    GetMat3Buffer()
    {
        throw new ErrGr2CurveDataMat3NotSupported();
    }

    /**
     * Gets a Tw2GeometryCurve
     * @param {Number} dimension
     * @return {Tw2GeometryCurve}
     */
    CreateTw2GeometryCurve(dimension)
    {
        let controls;

        switch(dimension)
        {
            case 3:
                controls = this.GetVec3Buffer();
                break;

            case 4:
                controls = this.GetQuatBuffer();
                break;

            case 9:
                controls = this.GetMat3Buffer();
                break;

            default:
                throw new ErrGr2CurveDataDimensionInvalid({ dimension });
        }

        const curve = new Tw2GeometryCurve();
        curve.dimension = dimension;
        curve.degree = this.degree;
        curve.knots = Array.from(this.GetKnots());
        curve.controls = Array.from(controls);
        return curve;
    }

    /**
     * Gets knots from controls
     * @param {TypedArray} controls
     * @param {Number} count
     * @param {Number} [scale=1]
     * @return {Float32Array}
     */
    static GetKnotsFromControl(controls, count, scale = 1)
    {
        const out = new Float32Array(count);
        for (let i = 0; i < count; i++) out[i] = controls[i] / scale;
        return out;
    }

    /**
     *
     * @param {TypedArray} controls
     * @param {Number} count
     * @param {Number} oneOverKnotScaleTrunc
     * @return {Float32Array}
     */
    static GetKnotsFromControlWithOneOverKnotScaleTrunc(controls, count, oneOverKnotScaleTrunc)
    {
        return this.GetKnotsFromControl(
            controls,
            count,
            this.ConvertOneOverKnotScaleTrunc(oneOverKnotScaleTrunc)
        );
    }

    /**
     *
     * @param {Number} oneOverKnotScaleTrunc
     * @return {Number}
     */
    static ConvertOneOverKnotScaleTrunc(oneOverKnotScaleTrunc)
    {
        return (new Float32Array((new Uint32Array([ oneOverKnotScaleTrunc << 16 ])).buffer))[0];
    }

    /**
     * Creates a curve from json
     * TODO: Implement
     * @param {Object} json
     */
    static fromJSON(json)
    {
        throw new ErrFeatureNotImplemented({ feature: "granny curves from json" });
    }

    /**
     * Curve type
     * @type {{ROTATION: number, POSITION: number, SCALE_SHEAR: number}}
     */
    static Type = {
        POSITION: 1,
        ROTATION: 2,
        SCALE_SHEAR: 3
    };

}


export class ErrGr2CurveDataNotSerialized extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve data not serialized");
    }
}

export class ErrGr2CurveDataFormatInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid granny curve data format");
    }
}

export class ErrGr2CurveDataDimensionInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid dimension for granny curve (%dimension%)");
    }
}

export class ErrGr2CurveDataControlSizeInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny control size is invalid (%size%)");
    }
}


export class ErrGr2CurveDataVec3NotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve doesn't provide vec3 data");
    }
}

export class ErrGr2CurveDataRotationNotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve doesn't provide rotation data");
    }
}

export class ErrGr2CurveDataQuatNotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve doesn't provide quat data");
    }
}

export class ErrGr2CurveDataMat3NotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve doesn't provide mat3 data");
    }
}
