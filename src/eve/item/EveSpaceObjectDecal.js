import {vec3, quat, mat4, util, device, store, Tw2BaseClass} from "../../global";
import {Tw2PerObjectData, Tw2ForwardingRenderBatch} from "../../core/";

/**
 * Decal
 * TODO: Make "PickEffect" shared
 * TODO: Identify if "groupIndex" is deprecated
 * TODO: Identify if "parentBoneIndex" is deprecated
 * If "groupIndex" and "parentBoneIndex" are just used by the EveSOF, we may need to record this information if
 * we are going to convert this object back into a EveSOF object
 * @ccp EveSpaceObjectDecal
 *
 * @property {Tr2Effect} decalEffect           - Decal effect
 * @property {Boolean} display                 - Toggles decal visibility
 * @property {TypedArray} indexBuffer          - Decal index buffer
 * @property {Number} groupIndex               - Decals SOF group index
 * @property {Number} parentBoneIndex          - Decal's parent bone index
 * @property {Tw2GeometryRes} parentGeometry   - Decal's parent geometry
 * @property {Boolean} pickable                - Identifies if the decal is pickable
 * @property {Tw2Effect} pickEffect            - Decal pick effect
 * @property {vec3} position                   - Decal position
 * @property {quat} rotation                   - Decal rotation
 * @property {vec3} scaling                    - Decal scaling
 * @property {mat4} transform                  - Decal local transform
 * @property {mat4} transformInv               - Decal local transform inverse
 * @property {WebGLBuffer} _indexBuffer        - Decal index buffer
 * @property {Tw2PerObjectData} _perObjectData - Decal per object data
 */
export class EveSpaceObjectDecal extends Tw2BaseClass
{
    // ccp
    decalEffect = null;
    indexBuffer = [];
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

    // ccpwgl
    display = true;
    groupIndex = -1;
    parentGeometry = null;
    parentBoneIndex = -1;
    pickable = true;
    pickEffect = null;
    transform = mat4.create();
    transformInv = mat4.create();
    _indexBuffer = null;
    _perObjectData = Tw2PerObjectData.from(EveSpaceObjectDecal.perObjectData);
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
     * Fire on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
        mat4.invert(this.transformInv, this.transform);
    }

    /**
     * Sets the parent geometry
     * @param {Tw2GeometryRes} geometryRes
     */
    SetParentGeometry(geometryRes)
    {
        this.parentGeometry = geometryRes;
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

        if
        (
            this.display && effect && effect.IsGood() && this._indexBuffer && this.parentGeometry && this.parentGeometry.IsGood()
        )
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
            mat4.transpose(this._perObjectData.vs.Get("decalMatrix"), this.transform);
            mat4.transpose(this._perObjectData.vs.Get("invDecalMatrix"), this.transformInv);

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
            bkIB = this.parentGeometry.meshes[0].indexes,
            bkStart = this.parentGeometry.meshes[0].areas[0].start,
            bkCount = this.parentGeometry.meshes[0].areas[0].count,
            bkIndexType = this.parentGeometry.meshes[0].indexType;

        store.SetVariableValue("u_DecalMatrix", this.transform);
        store.SetVariableValue("u_InvDecalMatrix", this.transformInv);

        this.parentGeometry.meshes[0].indexes = this._indexBuffer;
        this.parentGeometry.meshes[0].areas[0].start = 0;
        this.parentGeometry.meshes[0].areas[0].count = this.indexBuffer.length;
        this.parentGeometry.meshes[0].indexType = device.gl.UNSIGNED_SHORT;

        this.parentGeometry.RenderAreas(0, 0, 1, batch.effect, technique);
        this.parentGeometry.meshes[0].indexes = bkIB;
        this.parentGeometry.meshes[0].areas[0].start = bkStart;
        this.parentGeometry.meshes[0].areas[0].count = bkCount;
        this.parentGeometry.meshes[0].indexType = bkIndexType;
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

}

Tw2BaseClass.define(EveSpaceObjectDecal, Type =>
{
    return {
        isStaging: true,
        type: "EveSpaceObjectDecal",
        category: "EveObjectItem",
        props: {
            decalEffect: ["Tr2Effect"],
            display: Type.BOOLEAN,
            indexBuffer: Type.ARRAY,
            groupIndex: Type.NUMBER,
            parentBoneIndex: Type.NUMBER,
            parentGeometry: ["Tw2GeometryRes"],
            pickable: Type.BOOLEAN,
            pickEffect: ["Tw2Effect"],
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            transform: Type.TR_LOCAL,
            transformInv: Type.MATRIX4
        }
    };
});

