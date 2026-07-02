import { meta } from "utils";
import { device, tw2 } from "global";
import { vec3, quat, mat4 } from "math";
import { GLESPerObjectDataEveSpaceObject, Tw2PerObjectData, Tw2ForwardingRenderBatch, Tw2Effect } from "core";


@meta.type("EveSpaceObjectDecal", true)
@meta.define({
    wgl: "EveSpaceObjectDecal",
    ccp: true
})
export class EveSpaceObjectDecal extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("Tw2Effect")
    decalEffect = null;

    @meta.boolean
    display = true;

    @meta.int32
    groupIndex = -1;

    //@meta.uint16Array
    //indexBuffer = [];

    @meta.int32
    parentBoneIndex = -1;

    @meta.boolean
    pickable = true;

    @meta.uint
    meshIndex = 0;

    @meta.int32
    logoType = -1;

    @meta.int32
    colorType = -1;

    @meta.struct("Tw2Effect")
    pickEffect = null;

    @meta.translation
    position = vec3.create();

    @meta.rotation
    rotation = quat.create();

    @meta.scaling
    scaling = vec3.fromValues(1, 1, 1);

    _dirty = true;
    _indexBuffer = null;
    _localTransform = mat4.create();
    _localTransformInverse = mat4.create();
    _offsetTransform = null;
    _perObjectData = Tw2PerObjectData.from(EveSpaceObjectDecal.perObjectData);
    _parentPerObjectData = new GLESPerObjectDataEveSpaceObject();
    _parentMeshIndex = 0;
    _parentGeometryRes = null;
    _parentTransform = null;
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
     * Checks if the decal is skinned
     * @returns {boolean}
     */
    get isSkinned()
    {
        return this._offsetTransform !== null;
    }

    /**
     * Initializes the decal
     */
    Initialize()
    {
        //this.Rebuild();
        this.UpdateValues();
        this._parentMeshIndex = this.meshIndex;
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        this._parentTransform = parentTransform;
    }

    /**
     * Updates the parent mesh index
     * @param {Tw2GeometryRes} geometryRes
     * @param {Number} [meshIndex=0]
     * @returns {Number}
     */
    ResolveParentMeshIndex(geometryRes, meshIndex = 0)
    {
        const meshes = geometryRes && geometryRes.meshes;
        if (!meshes || !meshes.length)
        {
            this._parentMeshIndex = 0;
            return 0;
        }

        let index = this._parentMeshIndex;
        if (EveSpaceObjectDecal.enableParentMeshIndex || index < 0 || index >= meshes.length)
        {
            index = meshIndex;
        }

        if (index < 0 || index >= meshes.length)
        {
            index = 0;
        }

        if (this._parentMeshIndex !== index)
        {
            this._parentMeshIndex = index;
            this._dirty = true;
        }

        return index;
    }

    /**
     * Gets parent per object data
     * @param {*} parentData
     * @returns {?Tw2PerObjectData}
     */
    GetParentPerObjectData(parentData)
    {
        if (!parentData) return null;
        if (parentData.vs && parentData.ps) return parentData;

        const perObjectData = parentData.perObjectData || parentData.legacyPerObjectData;
        if (perObjectData && perObjectData.vs && perObjectData.ps)
        {
            return perObjectData;
        }

        return GLESPerObjectDataEveSpaceObject.Pack(parentData, this._parentPerObjectData);
    }

    /**
     * Gets the world transform
     * @param {mat4} out
     * @returns {mat4} out
     */
    GetWorldTransform(out)
    {
        return mat4.multiply(out, this._localTransform, this._parentTransform);
    }

    /**
     * Gets the world direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldDirection(out)
    {
        const mat4_0 = mat4.alloc();
        this.GetWorldTransform(mat4_0);
        vec3.set(out, mat4_0[8], mat4_0[9], mat4_0[10]);
        mat4.unalloc(mat4_0);
        return vec3.normalize(out, out);
    }

    /**
     * Gets the mid point and normal
     * @param {vec3} midPoint
     * @param {vec3} normal
     * @returns {Boolean} true if successful
     */
    GetMidPointAndNormal(midPoint, normal)
    {
        const
            mesh = this._parentGeometryRes ? this._parentGeometryRes.meshes[this._parentMeshIndex] : null,
            indexBuffer = this._rawIndexBuffers[this._parentMeshIndex];

        if (!mesh || !indexBuffer)
        {
            vec3.set(midPoint, 0,0,0);
            vec3.set(normal, 0,0,0);
            return false;
        }

        if (mesh.GetMidPointAndNormal(midPoint, normal, indexBuffer, mesh.bufferData))
        {
            if (this._offsetTransform)
            {
                vec3.multiply(midPoint, midPoint, this._offsetTransform);
                vec3.multiply(normal, normal, this._offsetTransform);
            }
            return true;
        }

        return false;
    }

    /**
     * Gets the decals edges
     * @returns {null|Array}
     */
    GetEdges()
    {
        const
            mesh = this._parentGeometryRes ? this._parentGeometryRes.meshes[this._parentMeshIndex] : null,
            indexBuffer = this._rawIndexBuffers[this._parentMeshIndex];

        if (!mesh || !indexBuffer) return null;

        const edges = mesh.FindEdges(indexBuffer, mesh.bufferData);
        if (edges)
        {
            if (this._offsetTransform)
            {
                for (let i = 0; i < edges.length; i++)
                {
                    vec3.multiply(edges[i].start, edges[i].start, this._offsetTransform);
                    vec3.multiply(edges[i].end, edges[i].end, this._offsetTransform);
                }
            }
        }
        return edges;
    }

    /**
     * Gets the item's local transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        mat4.copy(m, this._localTransform);
        if (this._offsetTransform) mat4.multiply(m, this._offsetTransform, m);
        return m;
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
        this._midPoint = null;
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
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indexes), gl.STATIC_DRAW);
        }

        this._dirty = false;

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("rebuilt", this, opt);
        }
    }


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
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (!perObjectData) return false;

        this._parentGeometryRes = geometryRes;
        this.ResolveParentMeshIndex(geometryRes, meshIndex);

        if (this._dirty)
        {
            this.Rebuild();
        }

        if (!this._indexBuffer) return false;

        let effect;
        switch (mode)
        {
            case device.RM_DECAL:
                effect = this.decalEffect;
                break;

            case device.RM_PICKABLE:
                effect = this.pickable ? this.pickEffect : null;
                if (effect && effect.parameters && "ObjectId" in effect.parameters) effect.parameters["ObjectId"].x = this._id;
                break;
        }

        if (!effect || !effect.IsGood()) return false;

        const parentPerObjectData = this.GetParentPerObjectData(perObjectData);
        if (!parentPerObjectData) return false;

        // Todo: Update to new bone method so it doesn't have to calculate every frame
        let hasBone;
        if (this.parentBoneIndex >= 0)
        {
            const
                bones = perObjectData.jointMatrices || (parentPerObjectData.vs && parentPerObjectData.vs.Get("JointMat")),
                offset = this.parentBoneIndex * 12;

            if (bones && (bones[offset] || bones[offset + 4] || bones[offset + 8]))
            {
                if (!this._offsetTransform) this._offsetTransform = mat4.create();
                mat4.fromJointMatIndex(this._offsetTransform, bones, this.parentBoneIndex);
                mat4.transpose(this._perObjectData.vs.Get("parentBoneMatrix"), this._offsetTransform);
                hasBone = true;
            }
        }
        if (!hasBone) this._offsetTransform = null;

        this._perObjectData.vs.Set("worldMatrix", parentPerObjectData.vs.Get("WorldMat"));
        mat4.invert(this._perObjectData.vs.Get("invWorldMatrix"), this._perObjectData.vs.Get("worldMatrix"));
        mat4.transpose(this._perObjectData.vs.Get("decalMatrix"), this._localTransform);
        mat4.transpose(this._perObjectData.vs.Get("invDecalMatrix"), this._localTransformInverse);

        this._perObjectData.ps.SetIndex("displayData", 0, counter);
        this._perObjectData.ps.Set("shipData", parentPerObjectData.ps.data);

        const batch = new Tw2ForwardingRenderBatch();
        batch._geometryRes = geometryRes;
        batch.perObjectData = this._perObjectData;
        batch.geometryProvider = this;
        batch.meshIx = this._parentMeshIndex || 0;
        batch.meshIndex = this._parentMeshIndex || 0;
        batch.meshAreaIndex = this.meshIndex;
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
            mesh = batch._geometryRes && batch._geometryRes.meshes ? batch._geometryRes.meshes[this._parentMeshIndex] : null,
            indexBuffer = this.GetCurrentIndexBuffer();

        if (!mesh || !indexBuffer || !mesh.indexes || !mesh.areas || !mesh.areas[0])
        {
            return false;
        }

        const
            bkIB = mesh.indexes,
            bkStart = mesh.areas[0].start,
            bkCount = mesh.areas[0].count,
            bkIndexType = mesh.indexType;

        tw2.SetVariableValue("u_DecalMatrix", this._localTransform);
        tw2.SetVariableValue("u_InvDecalMatrix", this._localTransformInverse);

        mesh.indexes = this._indexBuffer;
        mesh.areas[0].start = 0;
        mesh.areas[0].count = indexBuffer.length;
        mesh.indexType = device.gl.UNSIGNED_INT;

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
    static set(item, values, opt = {})
    {
        opt.skipObjects = true;
        let updated = super.set(item, values, opt);

        if (values.meshIndex !== undefined && item._parentMeshIndex !== item.meshIndex)
        {
            item._parentMeshIndex = item.meshIndex;
            item._dirty = true;
            updated = true;
        }

        if (values.indexBuffers)
        {
            item._rawIndexBuffers.splice(0);
            for (let i = 0; i < values.indexBuffers.length; i++)
            {
                item.SetIndexBuffer(values.indexBuffers[i], i);
            }
            updated = true;
        }
        // Assume if the old style index buffer is provided then
        // all existing are removed
        else if (values.indexBuffer)
        {
            item._rawIndexBuffers.splice(0);
            item.SetIndexBuffer(values.indexBuffer, 0);
        }

        const effect = values.decalEffect || values.effect;
        if (effect)
        {
            if (effect instanceof Tw2Effect)
            {
                if (effect !== item.decalEffect)
                {
                    if (!item.decalEffect) item.decalEffect = new Tw2Effect();
                    item.decalEffect.SetValues(effect.GetValues());
                    updated = true;
                }
            }
            else if (!item.decalEffect)
            {
                item.decalEffect = Tw2Effect.from(effect);
                updated = true;
            }
            else
            {
                if (item.decalEffect.SetValues(effect)) updated = true;
            }
        }

        if (values.pickEffect)
        {
            if (values.pickEffect instanceof Tw2Effect)
            {
                if (values.pickEffect !== item.pickEffect)
                {
                    if (!item.pickEffect) item.pickEffect = new Tw2Effect();
                    item.pickEffect.SetValues(values.pickEffect.GetValues());
                    updated = true;
                }
            }
            else if (!item.pickEffect)
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
        out.indexBuffers = [];

        for (let i = 0; i < item._rawIndexBuffers.length; i++)
        {
            out.indexBuffers.push(Array.from(item._rawIndexBuffers[i]));
        }

        return super.get(item, out, opt);
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
            [ "parentBoneMatrix", mat4.create() ],
            [ "clampDecalToEdge", 4 ]
        ],
        ps: [
            [ "displayData", [ 0, 1, 0, 0 ] ],
            [ "shipData", 12 ]
        ]
    };

    static enableParentMeshIndex = false;

}


