import { CjsCmfFormat } from "@carbonenginejs/runtime/resource/formats/cmf";
import { prepareGr2JSON } from "./Gr2Preparation";


/**
 * Reader for Carbon Mesh Format `.cmf` geometry.
 *
 * CMF is what EVE Frontier ships: 4,340 `.cmf` files against four `.gr2` at
 * build 3512930, so a client that has it has almost nothing else. Without this
 * the engine answers `'Resource extension' store key is unregistered (cmf)`
 * and every Frontier hull loads nothing at all.
 *
 * ## It is the GR2 path, not a second one
 *
 * The runtime's CMF reader emits a GR2-shaped root - meshes, models,
 * animations, the same vertex channels - so the whole of `Gr2Reader` and the
 * preparation below it apply unchanged. What arrives here is a different
 * container of the same geometry, and the only thing this class does is open
 * it.
 *
 * ## Asynchronous, because the buffers are meshopt-compressed
 *
 * `Read` refuses outright: "CMF compressed GPU buffers require ReadAsync so
 * meshoptimizer can initialize". That is why `Tw2GeometryRes.Process` treats
 * this extension like `gr2` and yields the decode rather than calling
 * `Prepare` - a sync reader cannot open one of these files.
 *
 * It decodes on the rendering thread for now, where GR2 has a worker pool. The
 * pool is a separate piece of work: its worker imports the GR2 reader, and the
 * wasm meshopt initialisation has to go with it.
 */
export class CmfReader
{

    static extension = "cmf";

    /**
     * How the bytes are asked for.
     *
     * Declared, never defaulted: `DoCustomLoad` reads it straight off the
     * reader and hands it to the fetch, which refuses anything it does not
     * recognise - "Invalid fetch type: undefined" arrives long before any of
     * this class runs.
     */
    static requestResponseType = "arraybuffer";

    /**
     * The class a hydrated root is handed to.
     *
     * The runtime refuses `emit: "gr2"` with no classes at all, and everything
     * below the root is wanted plain - `hydrateNode` returns the fields
     * untouched for any key that has no class - so exactly one is registered.
     */
    static Root = class CmfRoot
    {
        SetValues(values)
        {
            Object.assign(this, values);
        }
    };

    /**
     * The packed tangent frame, under the name the geometry path knows.
     *
     * CMF declares `PackedTangent` and `PackedTangentLegacy` as usages of their
     * own, and Carbon maps BOTH to the ordinary TANGENT semantic while keeping
     * their four-component normalized storage - it does not call the tangent
     * codec on the render path, and the compiled shaders agree: `quadv5.sm_hi`
     * declares TANGENT0 as four components with no NORMAL or BITANGENT, and the
     * unpacked frame is a different shader. See the organization's
     * geometry-vertex-binding contract.
     *
     * So this renames rather than decodes. Unpacking here would produce three
     * three-component channels the Frontier shaders do not declare, and the
     * ranges differ as well - Int16Norm reaches the shader as SNORM where the
     * legacy UInt16Norm reaches it as UNORM - so the values are passed through
     * exactly as authored.
     *
     * Validation already makes either packed usage mutually exclusive with
     * Normal, Tangent and Binormal at the same index, so there is nothing to
     * collide with.
     */
    static PACKED_TANGENTS = [ "packedTangent", "packedTangentLegacy" ];

    /**
     * Decodes CMF bytes into the prepared JSON the GR2 path consumes.
     * @param {ArrayBuffer|Uint8Array} data
     * @param {Object} [options]
     * @returns {Promise<Object>}
     */
    static async Decode(data, options = {})
    {
        const format = new CjsCmfFormat({ emit: "gr2", classes: { Root: CmfReader.Root } });
        const root = await format.ReadAsync(data);

        // Spread, because the root is a class instance and the preparation
        // rewrites what it is handed: it deletes `mesh.vertex` once packed and
        // stamps `_prepared` on. A plain object is what every other path gives
        // it.
        const json = { ...root };

        for (const mesh of json.meshes ?? [])
        {
            const vertex = mesh.vertex;

            if (!vertex) continue;

            for (const key of CmfReader.PACKED_TANGENTS)
            {
                if (vertex[key]?.length && !vertex.tangent?.length) vertex.tangent = vertex[key];
                delete vertex[key];
            }
        }

        return prepareGr2JSON(json, options);
    }

}
