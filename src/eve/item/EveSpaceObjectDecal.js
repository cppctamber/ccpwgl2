import { meta } from "utils";
import { device, tw2 } from "global";
import { vec3, quat, mat4, tri3 } from "math";
import { Tw2PerObjectData, Tw2ForwardingRenderBatch, Tw2Effect } from "core";


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
    _offsetTransform = null;
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
    }

    /**
     * Gets the mid point and normal
     * @param {vec3} point
     * @param {vec3} normal
     */
    GetMidPointAndNormal(point, normal)
    {
        EveSpaceObjectDecal.getMidpointAndNormal(point, normal, this);
        if (this._offsetTransform)
        {
            vec3.multiply(point, point, this._offsetTransform);
            vec3.multiply(normal, normal, this._offsetTransform);
        }
    }

    /**
     * Gets the decals edges
     * @returns {null|Array}
     */
    GetEdges()
    {
        const edges = EveSpaceObjectDecal.getEdges(this);
        if (this._offsetTransform)
        {
            for (let i = 0; i < edges.length; i++)
            {
                vec3.multiply(edges[i].start, edges[i].start, this._offsetTransform);
                vec3.multiply(edges[i].end, edges[i].end, this._offsetTransform);
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
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STATIC_DRAW);
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
            case device.RM_DECAL:
                effect = this.decalEffect;
                break;

            case device.RM_PICKABLE:
                effect = this.pickable ? this.pickEffect : null;
                break;
        }

        if (!effect || !effect.IsGood()) return false;

        // Todo: Update to new bone method
        let hasBone;
        if (this.parentBoneIndex >= 0)
        {
            const
                bones = perObjectData.vs.Get("JointMat"),
                offset = this.parentBoneIndex * 12;

            if (bones[offset] || bones[offset + 4] || bones[offset + 8])
            {
                if (!this._offsetTransform) this._offsetTransform = mat4.create();
                mat4.fromJointMatIndex(this._offsetTransform, bones, this.parentBoneIndex);
                let bone = this._perObjectData.vs.Get("parentBoneMatrix");
                mat4.transpose(bone, this._offsetTransform);
                hasBone = true;
            }
        }
        if (!hasBone) this._offsetTransform = null;

        this._perObjectData.vs.Set("worldMatrix", perObjectData.vs.Get("WorldMat"));
        mat4.invert(this._perObjectData.vs.Get("invWorldMatrix"), this._perObjectData.vs.Get("worldMatrix"));
        mat4.transpose(this._perObjectData.vs.Get("decalMatrix"), this._localTransform);
        mat4.transpose(this._perObjectData.vs.Get("invDecalMatrix"), this._localTransformInverse);

        this._perObjectData.ps.SetIndex("displayData", 0, counter);
        this._perObjectData.ps.Set("shipData", perObjectData.ps.data);

        const batch = new Tw2ForwardingRenderBatch();
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

        if (values.decalEffect)
        {
            if (values.decalEffect instanceof Tw2Effect)
            {
                if (values.decalEffect !== values.decalEffect)
                {
                    item.decalEffect = values.decalEffect;
                    updated = true;
                }
            }
            else if (!item.decalEffect)
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
            if (values.pickEffect instanceof Tw2Effect)
            {
                if (values.pickEffect !== item.pickEffect)
                {
                    item.pickEffect = values.pickEffect;
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
            [ "parentBoneMatrix", mat4.create() ],
            [ "clampDecalToEdge", 4 ]
        ],
        ps: [
            [ "displayData", [ 0, 1, 0, 0 ] ],
            [ "shipData", 12 ]
        ]
    };

    /**
     * Gets the midpoint and normal for the decal
     * @param {vec3} outMidpoint
     * @param {vec3} outNormal
     * @param {EveSpaceObjectDecal} decal
     * @returns {boolean}
     */
    static getMidpointAndNormal(outMidpoint, outNormal, decal)
    {
        vec3.set(outMidpoint, 0, 0, 0);
        vec3.set(outNormal, 0, 0, 0);

        const res = decal._parentGeometryRes;

        // Todo: wait until it is ready
        if (!res || !res.IsGood()) return false;

        const
            indexBuffer = decal.GetIndexBuffer(decal._parentMeshIndex),
            mesh = res[decal._parentMeshIndex];

        if (!indexBuffer || !mesh) return false;

        const
            mat4_0 = mat4.alloc(),
            vec3_0 = vec3.alloc(),
            vec3_1 = vec3.alloc(),
            vec3_2 = vec3.alloc(),
            vec3_3 = vec3.alloc(),
            tri3_0 = tri3.alloc();

        // Find middle normal
        let faces = [];
        try
        {
            for (let i = 0; i < indexBuffer.length; i += 3)
            {
                const
                    v0 = mesh.GetVertexPosition(vec3_0, indexBuffer[i + 0]),
                    v1 = mesh.GetVertexPosition(vec3_1, indexBuffer[i + 1]),
                    v2 = mesh.GetVertexPosition(vec3_2, indexBuffer[i + 2]);

                tri3.fromVertices(tri3_0, v0, v1, v2);

                faces.push({
                    index: i / 3,
                    midPoint: tri3.getMidpoint([], tri3_0),
                    normal: tri3.getNormal([], tri3_0)
                });
            }

            for (let i = 0; i < faces.length; i++)
            {
                vec3.add(outMidpoint, outMidpoint, faces[i].midPoint);
                vec3.add(outNormal, outNormal, faces[i].normal);
            }

            vec3.divideScalar(outMidpoint, outMidpoint, faces.length);
            vec3.divideScalar(outNormal, outNormal, faces.length);
            return true;
        }
        catch (err)
        {
            return false;
        }
        finally
        {
            mat4.unalloc(mat4_0);
            vec3.unalloc(vec3_0);
            vec3.unalloc(vec3_1);
            vec3.unalloc(vec3_2);
            vec3.unalloc(vec3_3);
            tri3.unalloc(tri3_0);
        }
    }

    /**
     * Gets a decal's edges
     * @param {EveSpaceObjectDecal} decal
     * @returns {{faceIndex: *, start: *, end: *}[]|null}
     */
    static getEdges(decal)
    {
        const res = decal._parentGeometryRes;

        // Todo: wait until it is ready
        if (!res || !res.IsGood()) return null;

        const
            indexBuffer = decal.GetIndexBuffer(decal._parentMeshIndex),
            mesh = res.meshes[decal._parentMeshIndex];

        if (!indexBuffer || !mesh) return null;

        function isEqualEdge(a1, a2, b1, b2)
        {
            return vec3.equals(a1, b1) && vec3.equals(a2, b2) || vec3.equals(a1, b2) && vec3.equals(a2, b1);
        }

        const
            v1 = vec3.alloc(),
            v2 = vec3.alloc(),
            v3 = vec3.alloc(),
            edges = [];

        try
        {
            for (let i = 0; i < indexBuffer.length; i += 3)
            {
                mesh.GetVertexPosition(v1, indexBuffer[i + 0]);
                mesh.GetVertexPosition(v2, indexBuffer[i + 1]);
                mesh.GetVertexPosition(v3, indexBuffer[i + 2]);

                const edgeList = [ [ v1, v2 ], [ v2, v3 ], [ v3, v1 ] ];

                for (let x = 0; x < 3; x++)
                {
                    const
                        start = edgeList[x][0],
                        end = edgeList[x][1],
                        found = edges.find(x => isEqualEdge(x.start, x.end, start, end));

                    if (found)
                    {
                        found.faces.push(indexBuffer[i]);
                    }
                    else
                    {
                        edges.push({
                            start: vec3.clone(start),
                            end: vec3.clone(end),
                            faces: [ indexBuffer[i] ]
                        });
                    }
                }
            }

            return edges
                .filter(x => x.faces.length === 1)
                .map(x =>
                {
                    return {
                        start: x.start,
                        end: x.end,
                        faceIndex: x.faces[0]
                    };
                });

        }
        catch (err)
        {
            return null;
        }
        finally
        {
            vec3.unalloc(v1);
            vec3.unalloc(v2);
            vec3.unalloc(v3);
        }
    }
}


