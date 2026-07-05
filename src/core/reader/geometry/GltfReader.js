import CjsFormatGltf from "@carbonenginejs/format-gltf";
import { Gr2Reader } from "./Gr2Reader";


/**
 * Reader for self-contained binary `.glb` (glTF 2.0) files.
 *
 * Parses via CjsFormatGltf into the shared CarbonEngineJS JSON mesh schema
 * (the same shape CjsFormatGr2 emits), then builds a Tw2GeometryRes with
 * Gr2Reader's shared builder - identical to how Gr2Reader/GR2JsonReader/
 * OBJReader work.
 *
 * Only the self-contained `.glb` container is wired up here. Plain `.gltf`
 * (JSON manifest with separate external `.bin` buffers) is not - it needs a
 * side-channel fetch for the referenced buffer file(s) before CjsFormatGltf
 * can read it, which this resource-loading pipeline doesn't have yet.
 */
export class GltfReader
{

    /**
     * Prepares a geometry resource from GLB bytes
     * @param {ArrayBuffer|Uint8Array} data
     * @param {Tw2GeometryRes} res
     * @param {Object} [options]
     */
    static Prepare(data, res, options)
    {
        const json = CjsFormatGltf.read(data, { emit: "json" });
        Gr2Reader.BuildGeometryRes(json, res, options);
    }

    /**
     * Request response type
     * @type {string}
     */
    static requestResponseType = "arraybuffer";

    /**
     * File extension
     * @type {string}
     */
    static extension = "glb";

}
