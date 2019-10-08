import { Tw2RawData } from "./Tw2RawData";

/**
 * Tw2PerObjectData
 *
 * @property {?Tw2RawData} vs - Per object vertex shader data
 * @property {?Tw2RawData} ps - Per object pixel shader data
 * @class
 */
export class Tw2PerObjectData
{

    vs = null;
    ps = null;
    ffe = null;


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
