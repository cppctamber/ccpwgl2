import { meta } from "utils";
import { device, tw2 } from "global";
import { vec3, quat, mat4 } from "math";
import { Tw2PerObjectData, Tw2ForwardingRenderBatch, Tw2Effect, Tw2GeometryMesh } from "core";
import { RM_DECAL } from "constant";


@meta.type("EveSpaceObjectDecal", true)
export class EveSpaceObjectDecal extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("Tw2Effect")
    decalEffect = null;

    @meta.boolean
    display = true;

    @meta.uint
    groupIndex = -1;

    //@meta.uint16Array
    //indexBuffer = [];

    @meta.uint
    parentBoneIndex = -1;

    @meta.boolean
    pickable = true;

    @meta.struct("Tw2Effect")
    pickEffect = null;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    _dirty = true;
    _indexBuffer = null;
    _localTransform = mat4.create();
    _localTransformInverse = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveSpaceObjectDecal.perObjectData);
    _parentMeshIndex = 0;
    _parentGeometryRes = null;
    _rawIndexBuffers = [];

    /**
     * Alias for decalEffect
     * @returns {null|Tw2Effect}
     */
    get effect()
    {
        return this.decalEffect;
    }

    /**
     * Alias for decalEffect
     * @param {null|Tw2Effect} effect
     */
    set effect(effect)
    {
        this.decalEffect = effect;
    }

    /**
     * Initializes the decal
     */
    Initialize()
    {
        //this.Rebuild();
        this.UpdateValues();
    }

    /**
     * Gets the decals edges
     * @param {Number} [meshIndex=0]
     * @returns {null|Array}
     */
    GetEdges(meshIndex=0)
    {
        return this._parentGeometryRes
            ? EveSpaceObjectDecal.getEdges(this.GetIndexBuffer(meshIndex), this._parentGeometryRes, meshIndex)
            : null;
    }

    /**
     * Gets the item's local transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        return mat4.fromRotationTranslationScale(m, this.rotation, this.position, this.scaling);
    }

    /**
     * Gets effect resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.decalEffect) this.decalEffect.GetResources(out);
        if (this.pickEffect) this.pickEffect.GetResources(out);
        return out;
    }

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.position, this.scaling);
        mat4.invert(this._localTransformInverse, this._localTransform);
    }

    /**
     * Sets the index buffer
     * @param {Array} arr
     * @param {Number} [index=0]
     */
    SetIndexBuffer(arr, index = 0)
    {
        this._rawIndexBuffers[index] = arr ? Array.from(arr) : [];
        this._dirty = true;
    }

    /**
     * Unloads the decal's buffers
     * @param {object} [opt]
     */
    Unload(opt)
    {
        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("unloaded", this, opt);
        }
    }

    /**
     * Gets an index buffer by mesh index
     * @param {Number} meshIndex
     * @returns {*|null}
     */
    GetIndexBuffer(meshIndex)
    {
        return this._rawIndexBuffers[meshIndex] ? this._rawIndexBuffers[meshIndex] : null;
    }

    /**
     * Gets the current index buffer
     * @returns {Array|null}
     */
    GetCurrentIndexBuffer()
    {
        return this.GetIndexBuffer(this._parentMeshIndex);
    }

    /**
     * Rebuilds the object's buffers
     * TODO: Handle empty index buffers?
     * @param  {object} [opt]
     */
    Rebuild(opt)
    {
        this.Unload({ skipEvents: true });

        const
            gl = device.gl,
            indexes = this.GetCurrentIndexBuffer();

        if (indexes)
        {
            this._indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STATIC_DRAW);
        }

        this._dirty = false;

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("rebuilt", this, opt);
        }
    }

    static decalRenderMode = RM_DECAL;

    /**
     * Gets batches for rendering
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Tw2GeometryRes} geometryRes
     * @param {Number} [counter=0]
     * @param {Number} [meshIndex=0]
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData, geometryRes, counter = 0, meshIndex = 0)
    {
        if (!this.display || !geometryRes || !geometryRes.IsGood()) return false;

        this._parentGeometryRes = geometryRes;

        // Handle mesh index changes
        if (this._parentMeshIndex !== meshIndex)
        {
            this._parentMeshIndex = meshIndex;
            this._dirty = true;
        }

        if (this._dirty)
        {
            this.Rebuild();
        }

        if (!this._indexBuffer) return false;

        let effect;
        switch (mode)
        {
            case this.constructor.decalRenderMode: //device.RM_DECAL:
                effect = this.decalEffect;
                break;

            case device.RM_PICKABLE:
                effect = this.pickable ? this.pickEffect : null;
                break;
        }

        if (!effect || !effect.IsGood()) return false;

        const batch = new Tw2ForwardingRenderBatch();
        this._perObjectData.vs.Set("worldMatrix", perObjectData.vs.Get("WorldMat"));
        if (this.parentBoneIndex >= 0)
        {
            const
                bones = perObjectData.vs.Get("JointMat"),
                offset = this.parentBoneIndex * 12;

            if (bones[offset] || bones[offset + 4] || bones[offset + 8])
            {
                const bone = this._perObjectData.vs.Get("parentBoneMatrix");
                mat4.fromJointMatIndex(bone, bones, this.parentBoneIndex);
                mat4.transpose(bone, bone);
            }
        }

        mat4.invert(this._perObjectData.vs.Get("invWorldMatrix"), this._perObjectData.vs.Get("worldMatrix"));
        mat4.transpose(this._perObjectData.vs.Get("decalMatrix"), this._localTransform);
        mat4.transpose(this._perObjectData.vs.Get("invDecalMatrix"), this._localTransformInverse);

        this._perObjectData.ps.SetIndex("displayData", 0, counter);
        this._perObjectData.ps.Set("shipData", perObjectData.ps.data);

        batch._geometryRes = geometryRes;
        batch.perObjectData = this._perObjectData;
        batch.geometryProvider = this;
        batch.meshIx = meshIndex;
        batch.renderMode = mode;
        batch.effect = effect;
        accumulator.Commit(batch);
        return true;
    }

    /**
     * Renders the decal
     * @param {Tw2ForwardingRenderBatch} batch
     * @param {String} technique - technique name
     */
    Render(batch, technique)
    {
        const
            mesh = batch._geometryRes.meshes[batch.meshIx],
            bkIB = mesh.indexes,
            bkStart = mesh.areas[0].start,
            bkCount = mesh.areas[0].count,
            bkIndexType = mesh.indexType;

        tw2.SetVariableValue("u_DecalMatrix", this._localTransform);
        tw2.SetVariableValue("u_InvDecalMatrix", this._localTransformInverse);

        mesh.indexes = this._indexBuffer;
        mesh.areas[0].start = 0;
        mesh.areas[0].count = this.GetCurrentIndexBuffer().length;
        mesh.indexType = device.gl.UNSIGNED_SHORT;

        let rendered = batch._geometryRes.RenderAreas(0, 0, 1, batch.effect, technique);

        mesh.indexes = bkIB;
        mesh.areas[0].start = bkStart;
        mesh.areas[0].count = bkCount;
        mesh.indexType = bkIndexType;

        return rendered;
    }

    /**
     * Sets the item from a plain object
     * @param item
     * @param values
     * @param opt
     * @returns {boolean} true if updated
     */
    static set(item, values, opt)
    {
        let updated = super.set(item, values, opt);

        // If index buffers are provided, assume it is for all of them for now
        let indexBuffers = values.indexBuffer ? [ values.indexBuffer ] : values.indexBuffers;
        if (indexBuffers)
        {
            item._rawIndexBuffers.splice(0);

            for (let i = 0; i < indexBuffers.length; i++)
            {
                item.SetIndexBuffer(indexBuffers[i], i);
            }

            updated = true;
        }

        if (values.decalEffect)
        {
            if (!item.decalEffect)
            {
                item.decalEffect = Tw2Effect.from(values.decalEffect);
                updated = true;
            }
            else
            {
                if (item.decalEffect.SetValues(values.decalEffect)) updated = true;
            }
        }

        if (values.pickEffect)
        {
            if (!item.pickEffect)
            {
                item.pickEffect = Tw2Effect.from(values.pickEffect);
                updated = true;
            }
            else
            {
                if (item.pickEffect.SetValues(values.pickEffect)) updated = true;
            }
        }

        return updated;
    }

    /**
     * Gets the item as a plain object
     * @param item
     * @param out
     * @param opt
     * @returns {{}}
     */
    static get(item, out = {}, opt = {})
    {
        super.get(item, out, opt);

        out.indexBuffers = [];
        for (let i = 0; i < item._rawIndexBuffers.length; i++)
        {
            out.indexBuffers.push(Array.from(item._rawIndexBuffers[i]));
        }

        return out;
    }

    /**
     * Per object data
     * @type {{vs: *[], ps: *[]}}
     */
    static perObjectData = {
        vs: [
            [ "worldMatrix", 16 ],
            [ "invWorldMatrix", 16 ],
            [ "decalMatrix", 16 ],
            [ "invDecalMatrix", 16 ],
            [ "parentBoneMatrix", mat4.identity([]) ],
            [ "clampDecalToEdge", 4 ]
        ],
        ps: [
            [ "displayData", [ 0, 1, 0, 0 ] ],
            [ "shipData", 12 ]
        ]
    };

}

EveSpaceObjectDecal.getEdges = (function()
{
    function isEqualEdge(a1, a2, b1, b2)
    {
        return vec3.equals(a1, b1) && vec3.equals(a2, b2) || vec3.equals(a1, b2) && vec3.equals(a2, b1);
    }

    let v1, v2, v3;

    return function getEdges(indices, geometryRes, meshIndex)
    {
        if (!v1)
        {
            v1 = vec3.create();
            v2 = vec3.create();
            v3 = vec3.create();
        }

        const
            edges = [],
            { declaration, bufferData } = geometryRes.meshes[meshIndex],
            { offset } = declaration.FindUsage(0, 0),
            stride = declaration.stride / 4;

        for (let i = 0; i < indices.length; i += 3)
        {
            Tw2GeometryMesh.GetVertexElement(v1, indices[i + 0], stride, offset, 3, bufferData);
            Tw2GeometryMesh.GetVertexElement(v2, indices[i + 1], stride, offset, 3, bufferData);
            Tw2GeometryMesh.GetVertexElement(v3, indices[i + 2], stride, offset, 3, bufferData);

            const edgeList = [ [ v1, v2 ], [ v2, v3 ], [ v3, v1 ] ];

            for (let x = 0; x < 3; x++)
            {
                const
                    start = edgeList[x][0],
                    end = edgeList[x][1];

                const found = edges.find(x => isEqualEdge(x.start, x.end, start, end));
                if (found)
                {
                    found.faces.push(indices[i]);
                }
                else
                {
                    edges.push({
                        start: vec3.clone(start),
                        end: vec3.clone(end),
                        faces: [ indices[i] ]
                    });
                }
            }
        }

        return edges
            .filter(x => x.faces.length === 1)
            .map(x =>
            {
                return { start: x.start, end: x.end, faceIndex: x.faces[0] };
            });
    };

})();