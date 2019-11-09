import { Tw2BaseClass, device } from "global";
import { Tw2VertexDeclaration } from "./vertex";
import { Tw2ParticleElementDeclaration } from "particle/element/Tw2ParticleElementDeclaration";

/**
 * Tr2RuntimeInstanceData
 * Todo: Find out if this is actually needed anywhere
 *
 * @property {Number} _count
 * @property {Float32Array} _data
 * @property {Boolean} _dirty
 * @property {Tw2VertexDeclaration} _declaration
 * @property {WebGLBuffer} _vb
 * @property {Number} _vertexStride
 */
export class Tr2RuntimeInstanceData extends Tw2BaseClass
{

    _count = 0;
    _data = null;
    _dirty = true;
    _declaration = null;
    _vb = null;
    _vertexStride = 0;


    /**
     * GetMaxInstanceCount
     * @returns {number}
     */
    GetMaxInstanceCount()
    {
        return this._data ? this._data.length : 1;
    }

    /**
     * SetElementLayout
     * @param decl
     */
    SetElementLayout(decl)
    {
        if (this._vb)
        {
            device.gl.deleteBuffer(this._vb);
            this._vb = null;
        }

        this._vertexStride = 0;
        this._declaration = new Tw2VertexDeclaration();

        for (let i = 0; i < decl.length; ++i)
        {
            const element = new Tw2ParticleElementDeclaration();
            element.elementType = decl[i][0];
            element.dimension = decl[i][2];
            element.usageIndex = decl[i][1];

            const d = element.GetDeclaration();
            d.offset = this._vertexStride * 4;
            this._declaration.elements.push(d);
            this._vertexStride += element.dimension;
        }

        this._declaration.RebuildHash();
    }

    /**
     * SetData
     * @param data
     */
    SetData(data)
    {
        if (!this._declaration)
        {
            return;
        }
        this._data = data;
        this._count = this._data.length;
        this._dirty = true;
        this.UpdateData();
    }

    /**
     * SetItemElement
     * @param index
     * @param elementIndex
     * @param value
     * @constructor
     */
    SetItemElement(index, elementIndex, value)
    {
        if (this._declaration.elements[elementIndex].elements > 1)
        {
            for (let i = 0; i < this._declaration.elements[elementIndex].elements; ++i)
            {
                this._data[index][elementIndex][i] = value[i];
            }
        }
        else
        {
            this._data[index][elementIndex] = value;
        }

        this._dirty = true;
    }

    /**
     * SetItemElementRef
     * @param index
     * @param elementIndex
     * @param value
     * @constructor
     */
    SetItemElementRef(index, elementIndex, value)
    {
        this._data[index][elementIndex] = value;
        this._dirty = true;
    }

    /**
     * GetItemElement
     * @param index
     * @param elementIndex
     * @returns {*}
     */
    GetItemElement(index, elementIndex)
    {
        return this._data[index][elementIndex];
    }

    /**
     * UpdateData
     */
    UpdateData()
    {
        if (!this._dirty || !this._declaration)
        {
            return;
        }

        const
            gl = device.gl,
            vbData = new Float32Array(this._data.length * this._vertexStride);

        let offset = 0;

        for (let i = 0; i < this._data.length; ++i)
        {
            for (let j = 0; j < this._declaration.elements.length; ++j)
            {
                if (this._declaration.elements[j].elements === 1)
                {
                    vbData[offset++] = this._data[i][j];
                }
                else
                {
                    for (let k = 0; k < this._declaration.elements[j].elements; ++k)
                    {
                        vbData[offset++] = this._data[i][j][k];
                    }
                }
            }
        }

        if (!this._vb)
        {
            this._vb = gl.createBuffer();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);
        gl.bufferData(gl.ARRAY_BUFFER, vbData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this._dirty = false;
    }

    /**
     * Unloads the webgl buffer
     */
    Unload()
    {
        if (this._vb)
        {
            device.gl.deleteBuffer(this._vb);
            this._vb = null;
        }
    }

    /**
     * GetInstanceBuffer
     * @returns {WebglArrayBuffer}
     */
    GetInstanceBuffer()
    {
        return this._vb;
    }

    /**
     * GetInstanceDeclaration
     * @returns {Tw2VertexDeclaration}
     */
    GetInstanceDeclaration()
    {
        return this._declaration;
    }

    /**
     * GetInstanceStride
     * @returns {number}
     */
    GetInstanceStride()
    {
        return this._vertexStride * 4;
    }

    /**
     * GetInstanceCount
     * @returns {number}
     */
    GetInstanceCount()
    {
        return this._count;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [];
    }

}
