import { Tw2RawData } from "./Tw2RawData";

/**
 * Tw2PerObjectData
 *
 * @property {Tw2RawData|null} vs - Per object vertex shader data
 * @property {Tw2RawData|null} ps - Per object pixel shader data
 * @property {Int32Array|null} psInt - Per object pixel shader integer data
 * @property {Tw2RawData|null} ffe - Per object fixed function emulation
 * @property {Tw2RawData|null} perFrameVSData - Optional draw-local vertex frame data
 * @property {Tw2RawData|null} perFramePSData - Optional draw-local pixel frame data
 */
export class Tw2PerObjectData
{

    vs = null;
    ps = null;
    psInt = null;
    ffe = null;
    perFrameVSData = null;
    perFramePSData = null;

    /**
     * Creates per object data from values
     * @param {RawDataObject} values
     * @param {{}} [opt]
     * @param {Boolean} [opt.skipUpdate]
     * @returns {Tw2PerObjectData}
     */
    static from(values, opt)
    {
        const item = new Tw2PerObjectData();
        if (values)
        {
            if (values.ps) item.ps = Tw2RawData.from(values.ps, opt);
            if (values.vs) item.vs = Tw2RawData.from(values.vs, opt);
            if (values.ffe) item.ffe = Tw2RawData.from(values.ffe, opt);
        }
        return item;
    }
}
