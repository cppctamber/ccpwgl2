import CjsFormatObj from "@carbonenginejs/format-obj";
import { Gr2Reader } from "./Gr2Reader";


/**
 * Reader for Wavefront `.obj` files.
 *
 * Parses via CjsFormatObj into the shared CarbonEngineJS JSON mesh schema
 * (the same shape CjsFormatGr2 emits), then builds a Tw2GeometryRes with
 * Gr2Reader's shared builder - identical to how Gr2Reader/GR2JsonReader
 * work.
 */
export class OBJReader
{

    /**
     * Prepares a geometry resource from OBJ text
     * @param {String} data
     * @param {Tw2GeometryRes} res
     * @param {Object} [options]
     */
    static Prepare(data, res, options)
    {
        const json = CjsFormatObj.read(data, { emit: "json" });
        Gr2Reader.BuildGeometryRes(json, res, options);
    }

    /**
     * Request response type
     * @type {string}
     */
    static requestResponseType = "text";

    /**
     * File extension
     * @type {string}
     */
    static extension = "obj";

}
