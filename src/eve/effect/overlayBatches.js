import { Tw2GeometryBatch } from "core";
import { RM_DECAL, RM_OPAQUE, RM_TRANSPARENT } from "constant";


const OVERLAY_TYPE_OPAQUE_ONLY = 0;
const OVERLAY_TYPE_ALL = 1;


/** Collects the base geometry ranges an ordinary mesh overlay may decorate. */
export function CollectOverlayAreaBlocks(mesh, out = [ [], [] ])
{
    const meshIndex = Number(mesh.GetMeshIndex?.() ?? mesh.meshIndex) >>> 0;
    out[OVERLAY_TYPE_OPAQUE_ONLY].length = 0;
    out[OVERLAY_TYPE_ALL].length = 0;

    AddAreas(out[OVERLAY_TYPE_ALL], mesh.opaqueAreas, meshIndex);
    AddAreas(out[OVERLAY_TYPE_ALL], mesh.transparentAreas, meshIndex);
    AddAreas(out[OVERLAY_TYPE_ALL], mesh.decalAreas, meshIndex);
    AddAreas(out[OVERLAY_TYPE_OPAQUE_ONLY], mesh.opaqueAreas, meshIndex);

    OptimizeAreaBlocks(out[OVERLAY_TYPE_ALL]);
    OptimizeAreaBlocks(out[OVERLAY_TYPE_OPAQUE_ONLY]);
    return out;
}


/** Collects overlay ranges from an EveChildInstancedMeshes internal record. */
export function CollectInstancedOverlayAreaBlocks(mesh, out = [ [], [] ])
{
    out[OVERLAY_TYPE_OPAQUE_ONLY].length = 0;
    out[OVERLAY_TYPE_ALL].length = 0;

    for (const area of mesh.areas)
    {
        const mode = Number(area.batchType ?? area._batchType) >>> 0;
        const block = {
            start: Number(area.areaIndex ?? area.index) >>> 0,
            count: Number(area.areaCount ?? area.count ?? 1) >>> 0,
            meshIndex: Number(area.meshIndex ?? mesh.meshIndex) >>> 0
        };
        if (mode === RM_OPAQUE || mode === RM_TRANSPARENT || mode === RM_DECAL)
        {
            out[OVERLAY_TYPE_ALL].push(block);
        }
        if (mode === RM_OPAQUE)
        {
            out[OVERLAY_TYPE_OPAQUE_ONLY].push({ ...block });
        }
    }

    OptimizeAreaBlocks(out[OVERLAY_TYPE_ALL]);
    OptimizeAreaBlocks(out[OVERLAY_TYPE_OPAQUE_ONLY]);
    return out;
}


/** Emits one or more mesh overlays using ccpwgl's native geometry batches. */
export function EmitOverlayBatches(
    accumulator,
    perObjectData,
    batchType,
    overlays,
    areaBlocks,
    geometry,
    meshIndex)
{
    let committed = false;
    for (const overlay of overlays)
    {
        const effects = overlay.GetEffects(batchType);
        if (!effects || !effects.length) continue;
        const blocks = areaBlocks[overlay.GetType(batchType)] || [];
        committed = EmitEffects(
            accumulator, perObjectData, batchType, effects, blocks, geometry, meshIndex) || committed;
    }
    return committed;
}


/** Emits Carbon's armor-damage material across every overlay-compatible area. */
export function EmitDamageOverlayBatches(
    accumulator,
    perObjectData,
    batchType,
    effect,
    areaBlocks,
    geometry,
    meshIndex)
{
    if (!effect) return false;
    return EmitEffects(
        accumulator,
        perObjectData,
        batchType,
        [ effect ],
        areaBlocks[OVERLAY_TYPE_ALL],
        geometry,
        meshIndex
    );
}


function EmitEffects(accumulator, perObjectData, batchType, effects, blocks, geometry, meshIndex)
{
    let committed = false;
    for (const effect of effects)
    {
        if (!effect || (effect.IsGood && !effect.IsGood())) continue;
        for (const block of blocks)
        {
            const batch = new Tw2GeometryBatch();
            batch.renderMode = batchType;
            batch.perObjectData = perObjectData;
            batch.geometryRes = geometry;
            batch.meshIx = block.meshIndex ?? meshIndex;
            batch.start = block.start;
            batch.count = block.count;
            batch.effect = effect;
            accumulator.Commit(batch);
            committed = true;
        }
    }
    return committed;
}


function AddAreas(out, areas, meshIndex)
{
    for (const area of areas || [])
    {
        if (area.display === false) continue;
        out.push({
            start: Number(area.index) >>> 0,
            count: Number(area.count) >>> 0,
            meshIndex
        });
    }
}


function OptimizeAreaBlocks(blocks)
{
    blocks.sort((a, b) => a.meshIndex - b.meshIndex || a.start - b.start || a.count - b.count);
    let write = 0;
    for (const block of blocks)
    {
        if (!block.count) continue;
        const previous = write ? blocks[write - 1] : null;
        if (previous && block.meshIndex === previous.meshIndex &&
            block.start <= previous.start + previous.count)
        {
            previous.count = Math.max(previous.start + previous.count, block.start + block.count) - previous.start;
        }
        else
        {
            blocks[write++] = block;
        }
    }
    blocks.length = write;
    return blocks;
}
