import { isString } from "utils";
import { Gr2Reader } from "./Gr2Reader";


/**
 * Reader for legacy pre-converted `.gr2_json` text files.
 *
 * All graph-building logic (meshes/models/animations/skeletons/curves,
 * ambient occlusion, tangent packing, buffer creation) lives in Gr2Reader
 * as shared statics - this reader only handles the legacy text-specific
 * parsing quirks before delegating to it.
 *
 * @deprecated in favour of Gr2Reader, which reads `.gr2` directly with no
 * server-side pre-conversion step. Kept for existing cached `.gr2_json`
 * content until that is retired.
 */
export class GR2JsonReader
{

    static DEFAULT_OPTIONS = Gr2Reader.DEFAULT_OPTIONS;

    /**
     * Prepares a geometry resource
     * @param {String|Object} data
     * @param {Tw2GeometryRes} res
     * @param {Object} [options]
     */
    static Prepare(data, res, options)
    {
        if (isString(data))
        {
            // Temp fix invalid numbers
            // Remove this to increase performance
            data = JSON.parse(data
                .replaceAll("-nan(ind)", "0")
                .replaceAll("-inf", "0")
                .replaceAll("inf", "0")
            );
        }

        Gr2Reader.BuildGeometryRes(data, res, options);
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
    static extension = "gr2_json";

}
