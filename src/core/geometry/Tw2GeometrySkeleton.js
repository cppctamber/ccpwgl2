import { meta } from "utils";


@meta.type("Tw2GeometrySkeleton")
@meta.wgl.define("Tw2GeometrySkeleton")
export class Tw2GeometrySkeleton
{

    @meta.list("Tw2GeometryBone")
    bones = [];

    @meta.plain
    @meta.isPrivate
    // Named track masks resolved from bone extendedData: { maskName: Float32Array(boneCount) }.
    // One weight per bone, aligned to `bones` index (== Tw2Model.bones index). Null when none authored.
    trackMasks = null;


    /**
     * Builds named track masks from each bone's extendedData.
     * Mirrors CarbonEngine cmf::ExtractBoneWeights / GrannyExtractTrackMask:
     * every bone defaults to `defaultWeight`, then bones that carry the named member overlay their
     * weight. No parent inheritance, no normalization (masked layers use a default of 0).
     * @param {Number} [defaultWeight=0]
     * @returns {?Object} the built trackMasks map (or null if no bone authored any)
     */
    BuildTrackMasks(defaultWeight = 0)
    {
        const names = new Set();
        for (let i = 0; i < this.bones.length; i++)
        {
            const ed = this.bones[i].extendedData;
            if (ed) for (const key in ed) names.add(key);
        }

        if (!names.size)
        {
            this.trackMasks = null;
            return null;
        }

        this.trackMasks = {};
        for (const name of names)
        {
            const weights = new Float32Array(this.bones.length);
            for (let i = 0; i < this.bones.length; i++)
            {
                const ed = this.bones[i].extendedData;
                weights[i] = ed && name in ed ? ed[name] : defaultWeight;
            }
            this.trackMasks[name] = weights;
        }

        return this.trackMasks;
    }

}
