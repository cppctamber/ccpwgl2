import { GLESPerObjectData } from "core";


/**
 * Carbon's `EveLensflarePerObjectData` (`EveLensflare.cpp:20-45`): the same 32
 * bytes on the vertex and pixel per-object registers - the lens flare direction
 * with the sun size in w, then four uint indices into `FlareOcclusionBuffer`,
 * [0] the foreground block and [1] the background block.
 *
 * Only the translated shaders read it (cb3 in the lens flare vertex shader, cb4
 * in lens grime); the gles2 lens flare shaders declare no per-object registers.
 *
 * diverged: the indices are always 0. Tr2OcclusionBuffer holds one shared
 * element, and a float register carries the index as its bit pattern, so 0 is
 * written as 0.0.
 */
export class EveLensflarePerObjectData extends GLESPerObjectData
{

    constructor(opt)
    {
        super(EveLensflarePerObjectData.layout, opt);
        this.carbonPerObjectPacker = EveLensflarePerObjectData.carbonPerObjectPacker;
    }

    /**
     * Writes Carbon's `directionScale` into both stages
     * @param {vec3} direction - the lens flare direction
     * @param {Number} sunSize
     * @returns {EveLensflarePerObjectData}
     */
    Pack(direction, sunSize)
    {
        for (const rawData of [ this.vs, this.ps ])
        {
            rawData.Set("DirectionScale", [ direction[0], direction[1], direction[2], sunSize ]);
        }
        return this;
    }

    /** One run shared verbatim by both stages. */
    static sharedLayout = Object.freeze([
        [ "DirectionScale", 4 ],
        [ "Indices", 4 ]
    ]);

    static layout = Object.freeze({
        vs: EveLensflarePerObjectData.sharedLayout,
        ps: EveLensflarePerObjectData.sharedLayout
    });

    /** Carbon binds the same payload bytes directly to cb3 and cb4. */
    static carbonPerObjectPacker = {
        OnBeforeCarbonConstants(context)
        {
            context.carbonPerObjectPacker = this;
        },

        PackPerObjectVS(out, perObjectData)
        {
            return EveLensflarePerObjectData.CopyStage(out, perObjectData.vs);
        },

        PackPerObjectPS(out, perObjectData)
        {
            return EveLensflarePerObjectData.CopyStage(out, perObjectData.ps);
        }
    };

    static CopyStage(out, rawData)
    {
        out.fill(0);
        if (rawData) out.set(rawData.data.subarray(0, Math.min(rawData.data.length, out.length)));
        return out;
    }
}
