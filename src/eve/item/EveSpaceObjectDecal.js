import {vec3, quat, mat4, util, device, store, Tw2BaseClass} from "../../global";
import {Tw2PerObjectData, Tw2ForwardingRenderBatch} from "../../core/";
import {assignIfExists} from "../../global/util";
import {Tw2Effect} from "../../core/mesh";

/**
 * Decal
 * TODO: Make "PickEffect" shared
 * TODO: Identify if "groupIndex" is deprecated
 * TODO: Identify if "parentBoneIndex" is deprecated - Doesn't seem to be on the new SOF anywhere and is required
 * @ccp EveSpaceObjectDecal
 *
 * @property {String} name                     - Decal name
 * @property {Tw2Effect} decalEffect           - Decal effect
 * @property {Boolean} display                 - Toggles decal visibility
 * @property {TypedArray} indexBuffer          - Decal index buffer
 * @property {Number} groupIndex               - Decals SOF group index
 * @property {Number} parentBoneIndex          - Decal's parent bone index
 * @property {Boolean} pickable                - Identifies if the decal is pickable
 * @property {Tw2Effect} pickEffect            - Decal pick effect
 * @property {vec3} position                   - Decal position
 * @property {quat} rotation                   - Decal rotation
 * @property {vec3} scaling                    - Decal scaling
 * @property {WebGLBuffer} _indexBuffer        - Decal index buffer
 * @property {Tw2GeometryRes} _parentGeometry  - Decal's parent geometry
 * @property {Tw2PerObjectData} _perObjectData - Decal per object data
 * @property {mat4} _transform                 - Decal local transform
 * @property {mat4} _transformInv              - Decal local transform inverse
 */
export class EveSpaceObjectDecal extends Tw2BaseClass
{
    // ccp
    name = "";
    decalEffect = null;
    indexBuffer = [];
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

    // ccpwgl
    display = true;
    groupIndex = -1;
    parentBoneIndex = -1;
    pickable = true;
    pickEffect = null;

    _indexBuffer = null;
    _parentGeometry = null;
    _perObjectData = Tw2PerObjectData.from(EveSpaceObjectDecal.perObjectData);
    _transform = mat4.create();
    _transformInv = mat4.create();
    _dirty = true;

    /**
     * Initializes the decal
     */
    Initialize()
    {
        this.Rebuild();
        this.UpdateValues();
    }

    /**
     * Gets effect resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out=[])
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
        mat4.fromRotationTranslationScale(this._transform, this.rotation, this.position, this.scaling);
        mat4.invert(this._transformInv, this._transform);
    }

    /**
     * Sets the parent geometry
     * @param {Tw2GeometryRes} geometryRes
     */
    SetParentGeometry(geometryRes)
    {
        this._parentGeometry = geometryRes;
    }

    /**
     * Unloads the decal's buffers
     */
    Unload()
    {
        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
    }

    /**
     * Rebuilds the object's buffers
     */
    Rebuild()
    {
        this.Unload();
        if (this.indexBuffer)
        {
            const
                gl = device.gl,
                indexes = new Uint16Array(this.indexBuffer);

            this._indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
        }

        this._dirty = false;
    }

    /**
     * Gets batches for rendering
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Number} [counter=0]
     */
    GetBatches(mode, accumulator, perObjectData, counter)
    {
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

        if (this._dirty)
        {
            this.Rebuild();
        }

        if (!this.display || !effect || !this._parentGeometry || !this._parentGeometry.meshes[0] || !this._indexBuffer)
        {
            return;
        }

        if (effect.IsGood() && this._parentGeometry.IsGood())
        {
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
                    bone[0] = bones[offset];
                    bone[1] = bones[offset + 4];
                    bone[2] = bones[offset + 8];
                    bone[3] = 0;
                    bone[4] = bones[offset + 1];
                    bone[5] = bones[offset + 5];
                    bone[6] = bones[offset + 9];
                    bone[7] = 0;
                    bone[8] = bones[offset + 2];
                    bone[9] = bones[offset + 6];
                    bone[10] = bones[offset + 10];
                    bone[11] = 0;
                    bone[12] = bones[offset + 3];
                    bone[13] = bones[offset + 7];
                    bone[14] = bones[offset + 11];
                    bone[15] = 1;
                    mat4.transpose(bone, bone);
                }
            }

            mat4.invert(this._perObjectData.vs.Get("invWorldMatrix"), this._perObjectData.vs.Get("worldMatrix"));
            mat4.transpose(this._perObjectData.vs.Get("decalMatrix"), this._transform);
            mat4.transpose(this._perObjectData.vs.Get("invDecalMatrix"), this._transformInv);

            this._perObjectData.ps.Get("displayData")[0] = counter || 0;
            this._perObjectData.ps.Set("shipData", perObjectData.ps.data);

            batch.perObjectData = this._perObjectData;
            batch.geometryProvider = this;
            batch.renderMode = mode;
            batch.effect = effect;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the decal
     * @param {Tw2ForwardingRenderBatch} batch
     * @param {String} technique - technique name
     */
    Render(batch, technique)
    {
        const
            mesh = this._parentGeometry.meshes[0],
            bkIB = mesh.indexes,
            bkStart = mesh.areas[0].start,
            bkCount = mesh.areas[0].count,
            bkIndexType = mesh.indexType;

        store.variables.SetValue("u_DecalMatrix", this._transform);
        store.variables.SetValue("u_InvDecalMatrix", this._transformInv);

        mesh.indexes = this._indexBuffer;
        mesh.areas[0].start = 0;
        mesh.areas[0].count = this.indexBuffer.length;
        mesh.indexType = device.gl.UNSIGNED_SHORT;

        this._parentGeometry.RenderAreas(0, 0, 1, batch.effect, technique);
        mesh.indexes = bkIB;
        mesh.areas[0].start = bkStart;
        mesh.areas[0].count = bkCount;
        mesh.indexType = bkIndexType;
    }

    /**
     * Creates a decal from a plain object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {EveSpaceObjectDecal}
     */
    static from(values, options)
    {
        const item = new EveSpaceObjectDecal();

        if (values)
        {
            assignIfExists(item, values, [
                "name", "display", "pickable",
                "position", "rotation", "scaling",
                "groupIndex", "parentBoneIndex"
            ]);

            if (values.indexBuffer)
            {
                item.indexBuffer = new Uint16Array(values.indexBuffer);
            }

            if (values.pickEffect)
            {
                item.pickEffect = Tw2Effect.from(values.pickEffect);
            }

            const decalEffect = values.decalEffect || values.effect;
            if (decalEffect)
            {
                item.decalEffect = Tw2Effect.from(decalEffect);
            }
        }

        if (!options || !options.skipUpdate)
        {
            item.Initialize();
        }

        return item;
    }

    /**
     * Per object data
     * @type {{vs: *[], ps: *[]}}
     */
    static perObjectData = {
        vs: [
            ["worldMatrix", 16],
            ["invWorldMatrix", 16],
            ["decalMatrix", 16],
            ["invDecalMatrix", 16],
            ["parentBoneMatrix", mat4.identity([])]
        ],
        ps: [
            ["displayData", 4],
            ["shipData", 4 * 3]
        ]
    };

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["decalEffect", r.object],
            ["name", r.string],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
            ["indexBuffer", r.indexBuffer]
        ];
    }
    
}
