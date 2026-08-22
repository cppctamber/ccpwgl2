// Source: E:\carbonengine\trinity\trinity\Tr2DirectInstanceData.h
// Source: E:\carbonengine\trinity\trinity\Tr2DirectInstanceData_Blue.cpp
import { meta } from "utils";
import { vec3 } from "math";


/**
 * The sibling of {@link Tw2RuntimeInstanceData}: an instance-data provider that
 * keeps NO cpu copy and writes straight into a gpu buffer, for the write-often
 * case (Carbon's own class comment).
 *
 * Almost nothing about it is persisted. Carbon maps exactly two attributes, both
 * `Be::READ` - the bounding box corners - because the instance data itself is
 * produced at runtime from whatever is driving the instancing, never authored.
 * That is why a smart light set's mesh carries one of these: the placements come
 * from the distribution each frame.
 *
 * Present so the data HYDRATES. The gpu side is not implemented, which costs
 * nothing today because ccpwgl's `EveChildInstanceMeshRenderer` - the only thing
 * that would drive it - is still a stub. Before this existed, a `.black` reaching
 * one failed outright with "Binary object type not found", taking the whole file
 * with it rather than just the instancing.
 */
@meta.type("Tw2DirectInstanceData", "Tr2DirectInstanceData")
@meta.define({
    wgl: "Tw2DirectInstanceData",
    ccp: "Tr2DirectInstanceData"
})
export class Tw2DirectInstanceData extends meta.Model
{

    /** m_aabb.m_min (Vector3) [READ] */
    @meta.vector3
    aabbMin = vec3.create();

    /** m_aabb.m_max (Vector3) [READ] */
    @meta.vector3
    aabbMax = vec3.create();

    _count = 0;
    _stride = 0;
    _declaration = null;
    _vb = null;

    /** Carbon Tr2DirectInstanceData::GetCount. */
    GetCount()
    {
        return this._count;
    }

    /** Carbon Tr2DirectInstanceData::GetStride. */
    GetStride()
    {
        return this._stride;
    }

    /** Carbon Tr2DirectInstanceData::GetLayout. */
    GetLayout()
    {
        return this._declaration;
    }

    /** Carbon Tr2DirectInstanceData::SetLayout. */
    SetLayout(layout)
    {
        this._declaration = layout;
    }

    /**
     * Carbon Tr2DirectInstanceData::IsInstanceDataReady. Never ready here -
     * nothing fills the buffer yet, and claiming otherwise would hand a consumer
     * an empty buffer to draw from.
     * @returns {Boolean}
     */
    IsInstanceDataReady()
    {
        return false;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        return out;
    }

}
