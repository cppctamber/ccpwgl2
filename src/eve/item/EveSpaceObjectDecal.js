import { meta, assignIfExists } from "utils";
import { device, store } from "global";
import { vec3, quat, mat4 } from "math";
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
    @meta.todo("Identify if deprecated, this may only be needed if created a SOF object from a decal")
    groupIndex = -1;

    @meta.indexBuffer
    indexBuffer = [];

    @meta.uint
    @meta.todo("Identify if deprecated, Doesn't seem to be on the new SOF anywhere but it is required, maybe default to 0?")
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
     * Unloads the decal's buffers
     */
    Unload(skipEvent)
    {
        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        if (!skipEvent)
        {
            this.EmitEvent("unloaded");
        }
    }

    /**
     * Rebuilds the object's buffers
     */
    Rebuild()
    {
        this.Unload(true);
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
        this.EmitEvent("rebuilt");
    }

    /**
     * Gets batches for rendering
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Tw2GeometryRes} geometryRes
     * @param {Number} [counter=0]
     */
    GetBatches(mode, accumulator, perObjectData, geometryRes, counter = 0)
    {
        if (!this.display || !geometryRes || !geometryRes.meshes[0] || !this._indexBuffer)
        {
            return;
        }

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

        if (!effect || !effect.IsGood() || !geometryRes.IsGood())
        {
            return;
        }

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
        mat4.transpose(this._perObjectData.vs.Get("decalMatrix"), this._localTransform);
        mat4.transpose(this._perObjectData.vs.Get("invDecalMatrix"), this._localTransformInverse);

        this._perObjectData.ps.SetIndex("displayData", 0, counter);
        this._perObjectData.ps.Set("shipData", perObjectData.ps.data);

        batch._geometryRes = geometryRes;
        batch.perObjectData = this._perObjectData;
        batch.geometryProvider = this;
        batch.renderMode = mode;
        batch.effect = effect;
        accumulator.Commit(batch);
    }

    /**
     * Renders the decal
     * @param {Tw2ForwardingRenderBatch} batch
     * @param {String} technique - technique name
     */
    Render(batch, technique)
    {
        const
            mesh = batch._geometryRes.meshes[0],
            bkIB = mesh.indexes,
            bkStart = mesh.areas[0].start,
            bkCount = mesh.areas[0].count,
            bkIndexType = mesh.indexType;

        store.variables.SetValue("u_DecalMatrix", this._localTransform);
        store.variables.SetValue("u_InvDecalMatrix", this._localTransformInverse);

        mesh.indexes = this._indexBuffer;
        mesh.areas[0].start = 0;
        mesh.areas[0].count = this.indexBuffer.length;
        mesh.indexType = device.gl.UNSIGNED_SHORT;

        batch._geometryRes.RenderAreas(0, 0, 1, batch.effect, technique);

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
            [ "worldMatrix", 16 ],
            [ "invWorldMatrix", 16 ],
            [ "decalMatrix", 16 ],
            [ "invDecalMatrix", 16 ],
            [ "parentBoneMatrix", mat4.identity([]) ]
        ],
        ps: [
            [ "displayData", [ 0, 1, 0, 0 ] ],
            [ "shipData", 12 ]
        ]
    };

}
