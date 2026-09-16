import { meta } from "utils";
import { CjsLightData } from "eve/lights/CjsLightData";
import { MatrixCopyFrom3x4 } from "eve/lights/lightConversion";
import { Tr2LightProfileRes } from "core/resource/Tr2LightProfileRes";
import { box3, quat, vec3, vec4, mat4 } from "math";
import { Tw2RenderBatch, Tw2VertexDeclaration } from "core";
import { EveObjectSet, EveObjectSetItem } from "eve";
import { device } from "global/tw2";


export class EveHazeSetBatch extends Tw2RenderBatch
{

    hazeSet = null;

    /**
     * Commits the haze set for rendering
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if rendered
     */
    Commit(technique)
    {
        return this.hazeSet.Render(technique);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.hazeSet && this.hazeSet.effect && this.hazeSet.effect.HasTechnique(technique);
    }

}


/**
 * Carbon EveHazeSetItem (`EveHazeSetItem.h`). `color` and `hazeData` arrive
 * resolved from SOF: `EveSOF::SetupHazeSets` folds hazeBrightness, falloff,
 * source size/brightness and booster influence into them (`EveSOF.cpp:1508,1518`).
 */
@meta.define("EveHazeSetItem", true)
export class EveHazeSetItem extends EveObjectSetItem
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.int32
    boneIndex = -1;

    @meta.color
    color = vec4.fromValues(0, 0, 0, 1);

    /** [hazeFalloff, sourceSize, sourceBrightness, boosterGainInfluence ? 1 : 0] */
    @meta.vector4
    hazeData = vec4.create();

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    /**
     * The item's own transform, rebuilt whenever its srt changes.
     * @type {mat4}
     */
    _transform = mat4.create();

    /** @type {?Tw2Bone} */
    _bone = null;

    /**
     * Fires on value changes
     */
    OnValueChanged(opt)
    {
        // Carbon TransformationMatrix(scaling, rotation, position) (`EveHazeSet.cpp:172`).
        mat4.fromRotationTranslationScale(this._transform, this.rotation, this.position, this.scaling);
        // Marks the item dirty and tells the parent set, which rebuilds its buffer.
        super.OnValueChanged(opt);
    }

    /**
     * Fires when the item is updated by the parent
     * @param parent
     */
    OnRebuiltByParent(parent)
    {
        this._parent = parent;
        this._bone = parent ? parent.GetBone(this.boneIndex) : null;
        this._dirty = false;
    }

    /**
     * Gets the item's bounding box.
     *
     * A box rather than a sphere: haze is placed with a full srt and is not
     * camera-facing, so rotating it covers different space.
     *
     * @param {box3} box
     * @returns {box3} box
     */
    GetBoundingBox(box)
    {
        box3.fromTransform(box, this._transform);
        if (this._bone) box3.transformMat4(box, box, this._bone.offsetTransform);
        return box;
    }

}


/** Carbon EveHazeSetLight: runtime SOF light record, separate from drawable items. */
@meta.define("EveHazeSetLight")
export class EveHazeSetLight extends meta.Model
{
    @meta.struct("CjsLightData")
    lightData = new CjsLightData();

    @meta.uint
    index = 0;

    @meta.matrix4
    boneMatrix = mat4.create();

    @meta.path
    lightProfilePath = "";

    @meta.boolean
    boosterGainInfluence = false;

    lightProfile = null;
    _resolvedProfilePath = "";

    OnValueChanged()
    {
        if (this.lightProfilePath !== this._resolvedProfilePath)
        {
            this._resolvedProfilePath = this.lightProfilePath;
            this.lightProfile = Tr2LightProfileRes.Resolve(this.lightProfilePath);
        }
    }
}


/**
 * Carbon EveHazeSet (`Attachments/Sets/EveHazeSet.cpp`). One box of 24 vertices
 * per item; the vertex shader places the box corners from the effect's
 * `BoxCornerOffset` table and ray-marches the haze in item space through the
 * inverse item transform.
 */
@meta.define("EveHazeSet", true)
export class EveHazeSet extends EveObjectSet
{

    @meta.list("EveHazeSetLight")
    lights = [];

    _activationStrength = 1;
    _boosterGain = 0;

    /** Carbon EveHazeSet::AddLightFromSOF. */
    AddLightFromSOF(light)
    {
        // Carbon pushes the record and its LightData by value, but keeps the profile shared.
        const values = light.GetValues ? light.GetValues() : { ...light };
        const data = values.lightData;
        values.lightData = CjsLightData.from(data.GetValues ? data.GetValues() : data);
        const record = EveHazeSetLight.from(values);
        record.lightProfile = light.lightProfile || null;
        this.lights.push(record);
    }

    /** Carbon EveHazeSet::UpdateLights; independent of drawable visibility. */
    UpdateLights(parentTransform, bones, boneCount, activationStrength, boosterGain)
    {
        for (const light of this.lights)
        {
            const index = light.lightData.boneIndex;
            // Donor quirk: bone zero takes the parent-only path (EveHazeSet.cpp).
            if (bones && index > 0 && index < boneCount)
            {
                if (typeof bones[0] === "number") MatrixCopyFrom3x4(light.boneMatrix, bones, index);
                else mat4.copy(light.boneMatrix, bones[index].offsetTransform);
                light.boneMatrix[3] = light.boneMatrix[7] = light.boneMatrix[11] = 0;
                light.boneMatrix[15] = 1;
                // Carbon bone * parent: reverse operands for gl-matrix.
                mat4.multiply(light.boneMatrix, parentTransform, light.boneMatrix);
            }
            else mat4.copy(light.boneMatrix, parentTransform);
        }
        this._activationStrength = activationStrength;
        this._boosterGain = boosterGain;
    }

    /** Carbon EveHazeSet::GetLights. The collector owns the submitted records. */
    GetLights(collector, parentContext = {})
    {
        // ccpwgl editor adaptation: explicit display switches also hide emitted lights.
        if (!this.display) return;
        for (const light of this.lights)
        {
            if (this.items[light.index] && !this.items[light.index].display) continue;
            light.OnValueChanged();
            const profile = light.lightProfile;
            const features = {
                parentBrightness: this._activationStrength * (light.boosterGainInfluence ? this._boosterGain : 1),
                parentScale: 1,
                profileIndex: profile ? profile.GetTextureIndex() + 1 : 0,
                animationTime: parentContext.animationTime ?? device.currentTime ?? 0
            };
            const record = light.lightData.AsPerPointLightData(light.boneMatrix, features, parentContext.shadowQuality ?? 0);
            record.lightType = 1;
            record.lightProfile = profile;
            record.owner = this;
            collector.Collect([ record ]);
        }
    }

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    /** Set by the SOF builder (Carbon `EveHazeSet::Setup`). */
    @meta.struct()
    effect = null;

    _decl = Tw2VertexDeclaration.from(EveHazeSet.vertexDeclarations);
    _vertexBuffer = null;
    _indexBuffer = null;
    _transformScratch = mat4.create();
    _inverseScratch = mat4.create();

    /**
     * Carbon's name for the items
     * @return {Array<EveHazeSetItem>}
     */
    get hazes()
    {
        return this.items;
    }

    /**
     * Carbon's name for the items
     * @param {Array<EveHazeSetItem>} arr
     */
    set hazes(arr)
    {
        this.items = arr;
    }

    /**
     * Alias for items
     * @return {Array<EveHazeSetItem>}
     */
    get hazeItems()
    {
        return this.items;
    }

    /**
     * Alias for items
     * @param {Array<EveHazeSetItem>} arr
     */
    set hazeItems(arr)
    {
        this.items = arr;
    }

    /**
     * Gets the haze set's resources
     * @param {Array} [out=[]]
     * @return {Array}
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        for (const light of this.lights)
        {
            light.OnValueChanged();
            if (light.lightProfile && !out.includes(light.lightProfile)) out.push(light.lightProfile);
        }
        return out;
    }

    /**
     * Unloads the haze set
     * @param {Object} [opt]
     */
    Unload(opt)
    {
        if (this._vertexBuffer)
        {
            device.gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        super.Unload(opt);
    }

    /**
     * Rebuilds the haze set's buffers (Carbon `EveHazeSet::OnPrepareResources`,
     * `EveHazeSet.cpp:117-201`).
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        this.RebuildItems(opt);
        this._dirty = false;

        const itemCount = this._visibleItems.length;
        if (!itemCount)
        {
            super.Rebuild(opt);
            return;
        }

        const
            mat4_0 = this._transformScratch,
            mat4_1 = this._inverseScratch,
            vertexSize = EveHazeSet.vertexSize,
            boxIndices = EveHazeSet.boxIndices,
            array = new Float32Array(itemCount * 24 * vertexSize);

        for (let i = 0; i < itemCount; i++)
        {
            const item = this._visibleItems[i];

            const transform = mat4.fromRotationTranslationScale(mat4_0, item.rotation, item.position, item.scaling);
            const inverse = mat4.invert(mat4_1, transform) || mat4.identity(mat4_1);

            for (let s = 0; s < 6; s++)
            {
                for (let j = 0; j < 4; j++)
                {
                    const vo = (i * 24 + s * 4 + j) * vertexSize;

                    // Carbon `_1k, _2k, _3k, _4k` rows; same byte layout in gl-matrix.
                    for (let k = 0; k < 3; k++)
                    {
                        array[vo + k * 4] = transform[k];
                        array[vo + k * 4 + 1] = transform[4 + k];
                        array[vo + k * 4 + 2] = transform[8 + k];
                        array[vo + k * 4 + 3] = transform[12 + k];

                        array[vo + 12 + k * 4] = inverse[k];
                        array[vo + 12 + k * 4 + 1] = inverse[4 + k];
                        array[vo + 12 + k * 4 + 2] = inverse[8 + k];
                        array[vo + 12 + k * 4 + 3] = inverse[12 + k];
                    }

                    array[vo + 24] = item.hazeData[0];
                    array[vo + 25] = item.hazeData[1];
                    array[vo + 26] = item.hazeData[2];
                    array[vo + 27] = item.hazeData[3];

                    array[vo + 28] = item.color[0];
                    array[vo + 29] = item.color[1];
                    array[vo + 30] = item.color[2];
                    array[vo + 31] = item.color[3];

                    // TEXCOORD7 - [index, boneIndex, pad, pad]
                    array[vo + 32] = boxIndices[s * 4 + j];
                    array[vo + 33] = item.boneIndex;
                    array[vo + 34] = 0;
                    array[vo + 35] = 0;
                }
            }
        }

        const
            { gl } = device,
            vertexCount = itemCount * 24,
            rebuildVertexBuffer = !this._vertexBuffer || this._vertexBuffer.count !== vertexCount;

        if (!this._vertexBuffer) this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        if (rebuildVertexBuffer)
        {
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
            this._vertexBuffer.count = vertexCount;
        }
        else
        {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, array);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const quadCount = vertexCount / 4;
        if (!this._indexBuffer || this._indexBuffer.count !== quadCount * 6)
        {
            // Carbon quad-list index buffer: per quad 0,2,1, 0,3,2 (`Tr2Renderer.cpp:294-310`).
            const
                wide = vertexCount > 0xffff,
                indexes = wide ? new Uint32Array(quadCount * 6) : new Uint16Array(quadCount * 6);

            for (let q = 0; q < quadCount; ++q)
            {
                const offset = q * 6, base = q * 4;
                indexes[offset] = base;
                indexes[offset + 1] = base + 2;
                indexes[offset + 2] = base + 1;
                indexes[offset + 3] = base;
                indexes[offset + 4] = base + 3;
                indexes[offset + 5] = base + 2;
            }

            if (!this._indexBuffer) this._indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this._indexBuffer.count = quadCount * 6;
            this._indexBuffer.type = wide ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
        }

        super.Rebuild(opt);
    }

    /**
     * Gets the haze set's render batch (Carbon `EveHazeSet::GetBatches`,
     * `EveHazeSet.cpp:254-292`).
     * @param {Number} mode
     * @param {Tw2BatchAccumulator}  accumulator
     * @param {Tw2PerObjectData}  perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (this.display && mode === device.RM_ADDITIVE && this.effect && this.effect.IsGood() && this._vertexBuffer && this._indexBuffer && this._visibleItems.length)
        {
            const batch = new EveHazeSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.hazeSet = this;
            batch.perObjectData = perObjectData;
            batch.effect = this.effect;
            accumulator.Commit(batch);
            return true;
        }
        return false;
    }

    /**
     * Renders the haze set
     * @param {String} technique
     * @return {boolean}
     */
    Render(technique)
    {
        if (!this.display || !this.effect || !this.effect.IsGood() || !this._vertexBuffer || !this._indexBuffer)
        {
            return false;
        }

        const { gl } = device;

        device.SetStandardStates(device.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(device, this.effect.GetPassInput(technique, pass), EveHazeSet.vertexSize * 4)) return false;
            device.ApplyShadowState();
            gl.drawElements(gl.TRIANGLES, this._indexBuffer.count, this._indexBuffer.type, 0);
        }
        return true;
    }

    /**
     * Haze set item constructor
     * @type {EveHazeSetItem}
     */
    static Item = EveHazeSetItem;

    /**
     * Floats per vertex: 8 x vec4 then TEXCOORD7 (4).
     * @type {Number}
     */
    static vertexSize = 36;

    /**
     * Carbon `s_boxInds[6][4]` (`EveHazeSet.cpp:158-165`): the corner of the
     * shader's `BoxCornerOffset` table each face vertex uses.
     * @type {Array<Number>}
     */
    static boxIndices = [
        0, 1, 2, 3,
        7, 6, 5, 4,
        0, 4, 5, 1,
        3, 2, 6, 7,
        1, 5, 6, 2,
        4, 0, 3, 7
    ];

    /**
     * Vertex declaration, in Carbon's order (`EveHazeSet.cpp:137-145`)
     * @type {Array<Object>}
     */
    static vertexDeclarations = [
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 4 },
        { usage: "COLOR", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 7, elements: 4 }
    ];

}
