// Source: E:\carbonengine\trinity\trinity\Tr2DirectInstanceData.h
// Source: E:\carbonengine\trinity\trinity\Tr2DirectInstanceData_Blue.cpp
import { meta } from "utils";
import { vec3 } from "math";
import { device } from "global/tw2";


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
 * The gpu side speaks the four-method contract `Tw2InstancedMesh.RenderAreas`
 * asks of any instance provider - buffer, declaration, stride, count - the same
 * one `Tw2RuntimeInstanceData` answers. The difference is what fills it: that
 * one owns a per-item cpu array and repacks it, this one is handed a packed
 * `Float32Array` and uploads it as is, because the producer (a distribution's
 * placement list) already has the data in that shape.
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

    /** Carbon Tr2DirectInstanceData::GetStride - in BYTES, as the consumer wants it. */
    GetStride()
    {
        return this._stride;
    }

    /** Carbon Tr2DirectInstanceData::GetLayout. */
    GetLayout()
    {
        return this._declaration;
    }

    /**
     * Carbon Tr2DirectInstanceData::SetLayout.
     *
     * The stride comes from the layout rather than being set alongside it, so
     * the two cannot disagree - a stride that does not match the declaration
     * reads every instance from the wrong offset and draws garbage without
     * erroring.
     *
     * @param {Tw2VertexDeclaration} layout
     */
    SetLayout(layout)
    {
        this._declaration = layout;
        this._stride = 0;

        if (layout)
        {
            for (const element of layout.elements)
            {
                this._stride += element.elements * 4;
            }
        }
    }

    /**
     * Uploads a packed instance buffer.
     *
     * Carbon splits this into `GetData(count)` (hand me a destination) and
     * `UpdateData()` (I have written it). There is no mapped gpu memory to hand
     * out here, so the producer builds its own array and passes it in - one
     * call, same effect.
     *
     * The buffer is REUSED rather than recreated. Creating a fresh one per
     * rebuild leaks a buffer per frame on a moving parent, and deleting the old
     * one poisons any attribute slot still attached to it, silently killing
     * unrelated draws for the rest of the frame.
     *
     * @param {Float32Array} data - packed, `count` instances of the layout
     * @param {Number} count
     */
    SetData(data, count)
    {
        const { gl } = device;

        this._count = count;

        if (!count || !this._declaration)
        {
            return;
        }

        if (!this._vb) this._vb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * Carbon Tr2DirectInstanceData::IsInstanceDataReady - whether the layout is
     * configured and something has been uploaded against it.
     * @returns {Boolean}
     */
    IsInstanceDataReady()
    {
        return !!(this._declaration && this._vb && this._count);
    }

    /**
     * Reported to `Tw2InstancedMesh.IsGood`, which gates the whole draw. False
     * until there is something to draw, so an empty distribution accumulates no
     * batch rather than a batch that renders nothing.
     * @returns {Boolean}
     */
    IsGood()
    {
        return this.IsInstanceDataReady();
    }

    /** @returns {WebGLBuffer|null} */
    GetInstanceBuffer()
    {
        return this._vb;
    }

    /** @returns {Tw2VertexDeclaration|null} */
    GetInstanceDeclaration()
    {
        return this._declaration;
    }

    /** @returns {Number} stride in bytes */
    GetInstanceStride()
    {
        return this._stride;
    }

    /** @returns {Number} */
    GetInstanceCount()
    {
        return this._count;
    }

    /** Releases the gpu buffer. */
    Unload()
    {
        if (this._vb)
        {
            device.gl.deleteBuffer(this._vb);
            this._vb = null;
        }
        this._count = 0;
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
