import { CjsGr2Format } from "@carbonenginejs/runtime-resource/formats/gr2";


/**
 * Reader for Granny State `.gsf` files.
 *
 * GSF shares the same Granny container as `.gr2`, but the payload is a
 * reflected state graph rather than render geometry. This reader projects the
 * authored state data onto the resource selected for the `.gsf` extension;
 * `Tr2GrannyStateRes` owns that contract while a legacy host may still select
 * `Tw2GeometryRes` until it updates its extension store.
 */
export class GsfReader
{

    /**
     * Prepares a GSF payload on a geometry resource.
     * @param {ArrayBuffer|Uint8Array|Object} data
     * @param {Tr2GrannyStateRes|Tw2GeometryRes} res
     */
    static Prepare(data, res)
    {
        const gsf = GsfReader.Read(data);
        if (!gsf?.stateMachine)
        {
            throw new TypeError("GsfReader expected a projected GSF document with a stateMachine");
        }

        res.gsf = gsf;
        res.format = gsf.format || "gsf";
        res.stateMachine = gsf.stateMachine || null;
        res.animationSets = Array.isArray(gsf.animationSets) ? gsf.animationSets : [];
        res.animationSlots = Array.isArray(gsf.animationSlots) ? gsf.animationSlots : [];
        res.gsfReferences = [ ...new Set(res.animationSets.flatMap(set =>
            Array.isArray(set?.sourceFileReferences) ? set.sourceFileReferences : []
        )) ];
    }

    /**
     * Reads GSF data from raw bytes, a reflected raw Granny root, or an
     * already projected document.
     * @param {ArrayBuffer|Uint8Array|Object} input
     * @returns {Object}
     */
    static Read(input)
    {
        if (input?.format === "gsf" && input?.stateMachine)
        {
            return input;
        }

        const raw = GsfReader.IsRaw(input)
            ? input
            : CjsGr2Format.readRaw(input);

        if (!CjsGr2Format.gsf.isRaw(raw))
        {
            throw new TypeError("GsfReader expected Granny State data");
        }

        return CjsGr2Format.readGsf(raw);
    }

    /**
     * Detects a reflected raw Granny State root.
     * @param {*} value
     * @returns {Boolean}
     */
    static IsRaw(value)
    {
        return !!value &&
            typeof value === "object" &&
            typeof value.version === "number" &&
            CjsGr2Format.gsf.isRaw(value);
    }

    /**
     * Detects Granny State bytes or raw reflected state roots.
     * @param {ArrayBuffer|Uint8Array|Object} data
     * @returns {Boolean}
     */
    static IsGSF(data)
    {
        if (GsfReader.IsRaw(data)) return true;
        if (data?.format === "gsf" && data?.stateMachine) return true;
        return CjsGr2Format.isGsf(data);
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
    static extension = "gsf";

}
