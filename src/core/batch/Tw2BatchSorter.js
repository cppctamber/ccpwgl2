
import { RM_ANY, RM_OPAQUE, RM_ADDITIVE, RM_DEPTH, RM_PICKABLE, RM_DISTORTION, RM_TRANSPARENT, RM_DECAL } from "constant";

const SortOrder = {
    [RM_ANY] : 0,
    [RM_OPAQUE] : 1,
    [RM_DEPTH] : 2,
    [RM_DECAL] : 3,
    [RM_TRANSPARENT] : 4,
    [RM_ADDITIVE] : 5,
    [RM_DISTORTION] : 6,
    [RM_PICKABLE] : 7
};

/**
 * Sorts batches by render mode
 * @param {Tw2RenderBatch} a
 * @param {Tw2RenderBatch} b
 * @returns {Number}
 */
export function tw2BatchSorter(a, b)
{
    return SortOrder[a.renderMode] - SortOrder[b.renderMode];
}

tw2BatchSorter.SortOrder = SortOrder;



/**
 *
 * @param a
 * @param b
 */
export function tw2DepthBatchSorter(a, b)
{

}
