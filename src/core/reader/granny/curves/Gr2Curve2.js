import { isVectorEqual, meta } from "utils";
import { Tw2GeometryCurve } from "core/geometry";
import { ErrFeatureNotImplemented, Tw2Error } from "core/Tw2Error";



@meta.type("Gr2Curve2")
export class Gr2Curve2 extends meta.Model
{

    @meta.uint
    dimension = -1;

    @meta.uint
    degree = 0;


    @meta.uint
    get format()
    {
        return this.constructor.format;
    }

    set format(v)
    {
        if (this.constructor.format !== v)
        {
            throw new ReferenceError(`Invalid format id "${v}" for curve, expected "${this.constructor.format}"`);
        }
    }

    /**
     * Gets the curve's duration
     * @return {Number}
     */
    GetDuration()
    {
        return this.GetKnots()[this.GetKnotCount() - 1];
    }


    /**
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        throw new ErrFeatureNotImplemented({ feature: "GetKnotCount" });
    }

    /**
     * Gets knots
     * @return {Float32Array}
     */
    GetKnots()
    {
        throw new ErrFeatureNotImplemented({ feature: "GetKnots" });
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
     * @param {Boolean} [purge]
     * @return {Tw2GeometryCurve}
     */
    CreateTw2GeometryCurve(dimension, purge)
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
        curve.format = this.format;
        curve.dimension = dimension;
        curve.degree = this.degree;
        curve.knots = Array.from(this.GetKnots());
        curve.controls = Array.from(controls);

        if (Gr2Curve2.VALIDATE)
        {
            const issues = Gr2Curve2.ValidateDecodedCurve(curve.knots, curve.controls, curve.dimension);

            // Controls count sanity check (uses instance degree)
            const expectedControlPoints = Math.max(0, curve.knots.length - curve.degree - 1);
            const controlPoints = curve.controls.length / curve.dimension;

            if (controlPoints !== expectedControlPoints)
            {
                issues.push(`Control point count mismatch: expected ${expectedControlPoints} got ${controlPoints}`);
            }

            if (issues.length)
            {
                // Keep this cheap and explicit; only runs when VALIDATE is enabled
                // eslint-disable-next-line no-console
                console.warn("Granny curve validation issues", { format: curve.format, dimension: curve.dimension, degree: curve.degree, issues });
            }
        }


        if (purge)
        {
            let wasPurged = false;

            const arr = Array.from(curve.controls).reverse();
            const k = Array.from(curve.knots).reverse();
            const count = arr.length / dimension - dimension;

            for (let i = 0; i < count; i++)
            {
                const c = [], n = [];
                for (let x = 0; x < dimension; x++)
                {
                    c[x] = arr[i * dimension + x];
                    n[x] = arr[(i + 1) * dimension + x];
                }

                if (isVectorEqual(c, n))
                {
                    wasPurged = true;
                    arr.splice(0, dimension);
                    k.splice(0, 1);
                    i--;
                }
            }


            if (wasPurged)
            {
                curve.knots = k.reverse();
                curve.controls = arr.reverse();
            }
        }

        return curve;
    }

    /**
     * Gets knots from controls
     * @param {TypedArray} controls
     * @param {Number} count
     * @param {Number} [scale=1]
     * @return {TypedArray}
     */
    static GetKnotsFromControl(controls, count, scale = 1,)
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
     * Enables lightweight curve validation (off by default)
     * Set true during debugging to catch exporter/decoder mismatches.
     * @type {boolean}
     */
    static VALIDATE = true;

    /**
     * Validates a decoded curve
     * @param {Array<number>} knots
     * @param {Array<number>} controls
     * @param {number} dimension
     * @return {string[]} issues
     */
    static ValidateDecodedCurve(knots, controls, dimension)
    {
        const issues = [];

        if (!Number.isFinite(dimension) || dimension <= 0) issues.push(`Invalid dimension "${dimension}"`);
        if (!Array.isArray(knots)) issues.push("Knots is not an array");
        if (!Array.isArray(controls)) issues.push("Controls is not an array");

        if (Array.isArray(knots))
        {
            if (knots.length === 0) issues.push("Knots is empty");
            for (let i = 0; i < knots.length; i++)
            {
                const k = knots[i];
                if (!Number.isFinite(k)) { issues.push(`Knot[${i}] is not finite`); break; }
                if (i > 0 && k < knots[i - 1]) { issues.push(`Knots are not monotonic at index ${i - 1}->${i}`); break; }
            }
        }

        if (Array.isArray(controls) && Number.isFinite(dimension) && dimension > 0)
        {
            if (controls.length % dimension !== 0) issues.push(`Controls length (${controls.length}) is not divisible by dimension (${dimension})`);

            // Expected control points: knotCount * dimension for degree 1, or (knotCount - degree - 1) * dimension for bsplines.
            // We can't know the exact expectation for every format here, but we can at least ensure we have enough controls.
            if (Array.isArray(knots) && knots.length && this.prototype && this.prototype.degree !== undefined)
            {
                // no-op: degree is per-instance, validation is done in CreateTw2GeometryCurve with instance degree
            }
        }

        return issues;
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
        super(data, "Invalid granny curve data dimension");
    }
}

export class ErrGr2CurveDataVec3NotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve data does not support vec3");
    }
}

export class ErrGr2CurveDataQuatNotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve data does not support quaternions");
    }
}

export class ErrGr2CurveDataMat3NotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve data does not support matrices");
    }
}

export class ErrGr2CurveDataRotationNotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve data does not support rotation");
    }
}

export class ErrGr2CurveDataControlSizeInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Granny curve data has invalid control size");
    }
}
