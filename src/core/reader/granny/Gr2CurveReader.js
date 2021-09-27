import * as curves from "./curves";
import { Tw2Error } from "core/Tw2Error";

/**
 * Todo: Replace with Tw2Store
 */
export class Gr2Curve
{

    formats = new Map();

    /**
     * Constructor
     */
    constructor()
    {
        this.formats.set(0, curves.Gr2CurveDataDaKeyframes32f);
        this.formats.set(1, curves.Gr2CurveDataDaK32fC32f);
        this.formats.set(2, curves.Gr2CurveDataDaIdentity);
        this.formats.set(3, curves.Gr2CurveDataDaConstant32f);
        this.formats.set(4, curves.Gr2CurveDataD3Constant32f);
        this.formats.set(5, curves.Gr2CurveDataD4Constant32f);
        this.formats.set(6, curves.Gr2CurveDataDaK16uC16u);
        this.formats.set(7, curves.Gr2CurveDataDaK8uC8u);
        this.formats.set(8, curves.Gr2CurveDataD4nK16uC15u);
        this.formats.set(9, curves.Gr2CurveDataD4nK8uC7u);
        this.formats.set(10, curves.Gr2CurveDataD3K16uC16u);
        this.formats.set(11, curves.Gr2CurveDataD3K8uC8u);
        this.formats.set(12, curves.Gr2CurveDataD9I1K16uC16u);
        this.formats.set(13, curves.Gr2CurveDataD9I3K16uC16u);
        this.formats.set(14, curves.Gr2CurveDataD9I1K8uC8u);
        this.formats.set(15, curves.Gr2CurveDataD9I3K8uC8u);
        this.formats.set(16, curves.Gr2CurveDataD3I1K32fC32f);
        this.formats.set(17, curves.Gr2CurveDataD3I1K16uC16u);
        this.formats.set(18, curves.Gr2CurveDataD3I1K8uC8u);
    }

    /**
     * Sets a format
     * @param {Number} format
     * @param {Function} Ctor
     */
    Register(format, Ctor)
    {
        this.formats.set(format, Ctor);
    }

    /**
     * Gets a format
     * @param {Number} format
     * @return {Gr2Curve}
     */
    Get(format)
    {
        const Ctor = this.formats.get(format);
        if (Ctor) return Ctor;
        throw new ErrGr2CurveDataFormatUnsupported({ format });
    }

    /**
     * Creates a granny curve from json
     * @param {Object} json
     * @return {Gr2Curve}
     */
    CreateCurveFromJSON(json)
    {
        const Ctor = this.Get(json.format);
        return Ctor.from(json);
    }

    /**
     * Creates a Tw2GeometryCurve from granny curve data in json format
     * @param {Object} json
     * @param {Number} dimension
     * @return {Tw2GeometryCurve}
     */
    CreateTw2GeometryCurveFromJSON(json, dimension)
    {
        const item = this.CreateCurveFromJSON(json);
        return item.CreateTw2GeometryCurve(dimension);
    }

}

export class ErrGr2CurveDataFormatUnsupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Unsupported granny curve data format (%format%)");
    }
}
