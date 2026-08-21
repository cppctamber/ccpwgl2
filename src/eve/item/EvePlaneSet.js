import { meta, assignIfExists } from "utils";
import { device } from "global";
import { vec3, vec4, quat, mat4, box3, sph3 } from "math";
import { Tw2VertexDeclaration, Tw2RenderBatch, Tw2Effect } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";
import { CjsLightData } from "../lights/CjsLightData";
import { Tr2Light } from "../lights/Tr2Light";
import { CreateLightRecord, CreateLightDataScratch, CopyLightData, AsPerPointLightData } from "../lights/lightConversion";
import { Fade, FadeType, Saturate } from "./EveSpaceObjectAttachmentUtils";


class EvePlaneSetBatch extends Tw2RenderBatch
{

    planeSet = null;

    /**
     * Commits the plan set
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if rendered
     */
    Commit(technique)
    {
        return this.planeSet.Render(technique);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.planeSet.effect && this.planeSet.effect.HasTechnique(technique);
    }

}


@meta.type("EvePlaneSetItem", true)
@meta.define({
    wgl: "EvePlaneSetItem",
    ccp: true
})
export class EvePlaneSetItem extends EveObjectSetItem
{

    @meta.string
    name = "";

    @meta.int32
    boneIndex = -1;

    @meta.color
    color = vec4.create();

    @meta.vector4
    layer1Scroll = vec4.create();

    @meta.vector4
    layer1Transform = vec4.create();

    @meta.vector4
    layer2Scroll = vec4.create();

    @meta.vector4
    layer2Transform = vec4.create();

    @meta.uint
    maskAtlasID = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.int32
    groupIndex = -1;

    // Published as TEXCOORD 8 - Carbon's `blinkData`, in its order
    // [rate, phase, dutyCycle, blinkMode] (`EvePlaneSetItem.h:47`). The shader
    // owns the fade curve; Carbon only computes `Fade()` CPU-side for the
    // separate plane LIGHT path, not for the vertex.

    @meta.float
    blinkRate = 0;

    @meta.float
    blinkPhase = 0;

    @meta.uint
    blinkMode = 0;

    @meta.float
    dutyCycle = 0;

    // Not implemented

    @meta.notImplemented
    @meta.float
    rate = 0;

    // ccpwgl only

    @meta.int32
    colorType = -1;

    _localTransform = mat4.create();
    _bone = null;

    /**
     * Checks if the item is skinned
     * @returns {boolean}
     */
    get isSkinned()
    {
        return this._bone !== null;
    }

    /**
     * Alias for maskAtlasID
     * @returns {number}
     */
    @meta.alias("maskAtlasID")
    get maskMapAtlasIndex()
    {
        return this.maskAtlasID;
    }

    /**
     * Alias for maskAtlasID
     * @param {number} value
     */
    set maskMapAtlasIndex(value)
    {
        this.maskAtlasID = value;
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
     * Gets the object's local transform
     * @param {mat4} out
     * @returns {mat4} out
     */
    GetTransform(out)
    {
        mat4.copy(out, this._localTransform);
        if (this._bone) mat4.multiply(out, this._bone.offsetTransform, out);
        return out;
    }

    /**
     * Gets the plane's local bounding box
     * @param {box3} out
     * @returns {box3} out
     */
    GetBoundingBox(out)
    {
        box3.fromTransform(out, this._localTransform);
        if (this._bone) box3.transformMat4(out, out, this._bone.offsetTransform);
        return out;
    }


    /**
     * Fires on value changes
     */
    OnValueChanged(opt)
    {
        mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.position, this.scaling);
        super.OnValueChanged(opt);
    }

    /**
     *
     * @param {EvePlaneSetItem} a
     * @param {Object} values
     * @param {Object} [opt]
     * @return {boolean}
     */
    static set(a, values, opt)
    {
        if (values && values.maskMapAtlasIndex !== undefined)
        {
            values.maskAtlasID = values.maskMapAtlasIndex;
        }

        return super.set(a, values, opt);
    }

}


/**
 * The light one plane contributes.
 *
 * Carbon holds these on the set as `m_lights` and fills them from SOF via
 * `AddLightFromSOF` (`EvePlaneSet.h:31,87`); they are NOT plane items and do not
 * render - each one only describes a light the set emits when the scene collects
 * lights. Its `lightData` radii were derived from the SOF multipliers and the
 * owning item's scale (see `EveSOFDataPointLightAttachment.AsLightData`).
 */
@meta.type("EvePlaneLight")
@meta.define({ wgl: "EvePlaneLight", ccp: true })
export class EvePlaneLight extends meta.Model
{

    @meta.struct("CjsLightData")
    lightData = new CjsLightData();

    @meta.float
    saturation = 1;

    @meta.notOwned
    @meta.struct()
    lightProfile = null;

    @meta.uint
    fadeType = FadeType.FT_NONE;

    @meta.float
    blinkPhase = 0;

    @meta.float
    blinkRate = 0;

    @meta.uint
    index = 0;

    @meta.matrix4
    boneMatrix = mat4.create();

    @meta.path
    lightProfilePath = "";

    static FadeType = FadeType;

}


@meta.type("EvePlaneSet", true)
@meta.define({
    wgl: "EvePlaneSet",
    ccp: true
})
export class EvePlaneSet extends EveObjectSet
{

    @meta.string
    name = "";

    @meta.struct()
    effect = null;

    @meta.notImplemented
    @meta.boolean
    hideOnLowQuality = false;

    @meta.notImplemented
    @meta.byte
    pickBufferID = 0;

    /**
     * Carried from the hull's plane set data, because it decides whether this
     * set shows video — see `EveSOFDataHullPlaneSet.Usage`.
     *
     * Kept on the runtime set rather than read from the SOF data at the point of
     * use, so the object can answer for itself afterwards: `RandomizeBillboards`
     * is a public method that runs long after the build, and reaching back into
     * the source data from there would tie a rendered object to the catalogue it
     * came from.
     * @type {Number}
     */
    @meta.uint
    usage = 0;

    _vertexBuffer = null;
    _indexBuffer = null;
    _decl = Tw2VertexDeclaration.from(EvePlaneSet.vertexDeclarations);

    /**
     * Alias for this.items
     * @returns {Array}
     */
    @meta.list("EvePlaneSetItem")
    get planes()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set planes(arr)
    {
        this.items = arr;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        return out;
    }

    /**
     * Unloads the set's buffers
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
     * Rebuilds the plane set's buffers
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        //this.Unload({ skipEvents: true });
        this.RebuildItems(opt);
        this._dirty = false;
        const itemCount = this._visibleItems.length;
        if (!itemCount)
        {
            super.Rebuild(opt);
            return;
        }

        const
            vertexSize = EvePlaneSet.vertexSize,
            // Where TEXCOORD 7 starts. Written as `vertexSize - 3` before, which
            // only held while TEXCOORD 7 was the last, 3-wide element.
            indexOffset = 32,
            array = new Float32Array(itemCount * 4 * vertexSize);

        for (let i = 0; i < itemCount; ++i)
        {
            const
                item = this._visibleItems[i],
                offset = i * 4 * vertexSize;

            array[offset + indexOffset] = 0;
            array[offset + vertexSize + indexOffset] = 1;
            array[offset + 2 * vertexSize + indexOffset] = 2;
            array[offset + 3 * vertexSize + indexOffset] = 3;

            // Ask the item where it IS, rather than reading the authored field
            // beside it. `_localTransform` carries no bone, while
            // `EvePlaneSetItem.GetTransform` composes one - so a plane riding a
            // moving bone used to be BOUNDED where it moved to (GetBoundingBox is
            // bone aware) and DRAWN where it was authored. Resolved once per item,
            // not per vertex.
            const transform = item.GetTransform(EveObjectSet.global.mat4_0);

            for (let j = 0; j < 4; ++j)
            {
                const vtxOffset = offset + j * vertexSize;
                array[vtxOffset] =      transform[0];
                array[vtxOffset + 1] =  transform[4];
                array[vtxOffset + 2] =  transform[8];
                array[vtxOffset + 3] =  transform[12];
                array[vtxOffset + 4] =  transform[1];
                array[vtxOffset + 5] =  transform[5];
                array[vtxOffset + 6] =  transform[9];
                array[vtxOffset + 7] =  transform[13];
                array[vtxOffset + 8] =  transform[2];
                array[vtxOffset + 9] =  transform[6];
                array[vtxOffset + 10] = transform[10];
                array[vtxOffset + 11] = transform[14];

                array[vtxOffset + 12] = item.color[0];
                array[vtxOffset + 13] = item.color[1];
                array[vtxOffset + 14] = item.color[2];
                array[vtxOffset + 15] = item.color[3] * EvePlaneSet.alphaMultiplier;

                array[vtxOffset + 16] = item.layer1Transform[0];
                array[vtxOffset + 17] = item.layer1Transform[1];
                array[vtxOffset + 18] = item.layer1Transform[2];
                array[vtxOffset + 19] = item.layer1Transform[3];

                array[vtxOffset + 20] = item.layer2Transform[0];
                array[vtxOffset + 21] = item.layer2Transform[1];
                array[vtxOffset + 22] = item.layer2Transform[2];
                array[vtxOffset + 23] = item.layer2Transform[3];

                array[vtxOffset + 24] = item.layer1Scroll[0];
                array[vtxOffset + 25] = item.layer1Scroll[1];
                array[vtxOffset + 26] = item.layer1Scroll[2];
                array[vtxOffset + 27] = item.layer1Scroll[3];

                array[vtxOffset + 28] = item.layer2Scroll[0];
                array[vtxOffset + 29] = item.layer2Scroll[1];
                array[vtxOffset + 30] = item.layer2Scroll[2];
                array[vtxOffset + 31] = item.layer2Scroll[3];

                // TEXCOORD 7 - [index, boneIndex, maskMapAtlasIndex, pickBufferID].
                // The corner index at +32 is written per-quad above.
                array[vtxOffset + 33] = item.boneIndex;
                array[vtxOffset + 34] = item.maskAtlasID;
                array[vtxOffset + 35] = this.pickBufferID;

                // TEXCOORD 8 - blinkData, in Carbon order.
                array[vtxOffset + 36] = item.blinkRate;
                array[vtxOffset + 37] = item.blinkPhase;
                array[vtxOffset + 38] = item.dutyCycle;
                array[vtxOffset + 39] = item.blinkMode;
            }
        }

        const
            { gl } = device,
            rebuildVertexBuffer = !this._vertexBuffer || this._vertexBuffer.count !== itemCount;

        if (!this._vertexBuffer) this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        if (rebuildVertexBuffer)
        {
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);
            this._vertexBuffer.count = itemCount;
        }
        else
        {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, array);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        if (!this._indexBuffer || this._indexBuffer.count !== itemCount * 6)
        {
            const indexes = new Uint16Array(itemCount * 6);
            for (let i = 0; i < itemCount; ++i)
            {
                const
                    offset = i * 6,
                    vtxOffset = i * 4;

                indexes[offset] = vtxOffset;
                indexes[offset + 1] = vtxOffset + 2;
                indexes[offset + 2] = vtxOffset + 1;
                indexes[offset + 3] = vtxOffset;
                indexes[offset + 4] = vtxOffset + 3;
                indexes[offset + 5] = vtxOffset + 2;
            }

            if (!this._indexBuffer) this._indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this._indexBuffer.count = itemCount * 6;
        }

        super.Rebuild(opt);
    }

    /**
     * Gets the plane set's render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (this.display && mode === device.RM_ADDITIVE && this.effect && this.effect.IsGood() && this._indexBuffer && this._vertexBuffer && this._visibleItems.length)
        {
            const batch = new EvePlaneSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.planeSet = this;
            batch.perObjectData = perObjectData;
            batch.effect = this.effect;
            accumulator.Commit(batch);
            return true;
        }
        return false;
    }

    /**
     * Renders the plane set
     * @param {String} technique - technique name
     */
    Render(technique)
    {
        if (!this.effect || !this.effect.IsGood() || !this._vertexBuffer || !this._indexBuffer) return false;

        const { gl } = device;

        device.SetStandardStates(device.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(device, this.effect.GetPassInput(technique, pass), EvePlaneSet.vertexSize * 4)) return false;
            device.ApplyShadowState();
            gl.drawElements(gl.TRIANGLES, this._indexBuffer.count, gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }

    /**
     * Creates an eve plane from a plain object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {EvePlaneSet}
     */
    static from(values, options)
    {
        const item = new EvePlaneSet();

        if (values)
        {
            assignIfExists(item, values, [ "name", "display", "hideOnLowQuality" ]);

            if (values.effect)
            {
                item.effect = Tw2Effect.from(values.effect);
            }

            if (values.items)
            {
                for (let i = 0; i < values.items.length; i++)
                {
                    item.CreateItem(values.items[i]);
                }
            }
        }

        if (!options || !options.skipUpdate)
        {
            item.Initialize();
        }
        return item;
    }

    /**
     * The plane set's item constructor
     * @type {EvePlaneSetItem}
     */
    /**
     * The lights this set emits, filled from SOF. Carbon `m_lights`
     * (`EvePlaneSet.h:87`).
     * @type {Array<EvePlaneLight>}
     */
    @meta.list("EvePlaneLight")
    lights = [];

    /**
     * Carbon `EvePlaneSet::AddLightFromSOF` (`cpp`) - a plain push.
     * @param {EvePlaneLight|Object} light
     */
    AddLightFromSOF(light)
    {
        if (!light) return;
        this.lights.push(light instanceof EvePlaneLight ? light : EvePlaneLight.from(light));
    }

    /**
     * The tint every light this set emits is multiplied by.
     *
     * Carbon `EvePlaneSet::GetAverageColor` (`cpp:499-528`) is the componentwise
     * product of the four texture parameters' average colours, each defaulting to
     * white when the map or its resource is missing.
     *
     * ccpwgl has no average-colour readback on a texture resource yet (the same
     * gap `Tr2TexturedPointLight` records), so every map answers white and the
     * product is white - the light keeps its authored colour untinted. That is
     * the honest degradation: it is the value Carbon itself uses for a missing
     * map, so nothing is invented here, and wiring real averages later needs no
     * change at this call site.
     *
     * @param {vec4} [out]
     * @returns {vec4}
     */
    GetAverageColor(out = vec4.create())
    {
        return vec4.set(out, 1, 1, 1, 1);
    }

    /**
     * Emits this set's lights into the frame's collector.
     *
     * Carbon `EvePlaneSet::GetLights` (`cpp:544-568`). The loop iterates BY VALUE
     * there - `auto light` plus a `lightDataCopy` - so the STORED light data is
     * never mutated; the scratch copy below preserves that, and it matters
     * because the tint and fade are reapplied every frame.
     *
     * Per light: colour = authored * the set's average colour, componentwise;
     * then Saturate, which extrapolates above 1; then brightness *= the fade for
     * its blink type. `parentBrightness` is the set's activation strength.
     *
     * @param {Tw2CarbonLightCollector} collector
     * @param {Object} [parentContext]
     * @param {Number} [parentContext.animationTime=0] - Carbon reads a global clock here
     * @param {Number} [parentContext.shadowQuality=0]
     */
    GetLights(collector, parentContext = {})
    {
        if (!collector || !this.lights.length) return;

        const
            features = EvePlaneSet._features || (EvePlaneSet._features = { parentBrightness: 1, parentScale: 1, profileIndex: 0 }),
            averageColor = this.GetAverageColor(EvePlaneSet._averageColor || (EvePlaneSet._averageColor = vec4.create())),
            dataCopy = EvePlaneSet._lightData || (EvePlaneSet._lightData = CreateLightDataScratch()),
            animationTime = parentContext.animationTime || 0,
            shadowQuality = parentContext.shadowQuality || 0;

        // Carbon keeps activation strength on the set itself
        // (`m_activationStrength`, EvePlaneSet::GetLights cpp:547). ccpwgl has no
        // such field: activation strength lives on the ROOT object's per-object
        // data, which is where `EveBoosterSet` reads it from too
        // (`EveBoosterSet.js:495-515`, `parentData.activationStrength`). So it is
        // passed down rather than stored, and either spelling is accepted -
        // the value directly, or the per-object data it rides in.
        const parentData = parentContext.parentData;
        features.parentBrightness = parentContext.activationStrength !== undefined
            ? parentContext.activationStrength
            : (parentData && parentData.activationStrength !== undefined ? parentData.activationStrength : 1);
        features.parentScale = 1;

        for (let i = 0; i < this.lights.length; i++)
        {
            const light = this.lights[i];
            if (!light || !light.lightData) continue;

            CopyLightData(dataCopy, light.lightData);
            dataCopy.color[0] *= averageColor[0];
            dataCopy.color[1] *= averageColor[1];
            dataCopy.color[2] *= averageColor[2];
            dataCopy.color[3] *= averageColor[3];
            Saturate(dataCopy.color, dataCopy.color, light.saturation);

            dataCopy.brightness *= Fade(animationTime, light.fadeType, light.blinkRate, light.blinkPhase);

            // A FRESH record per light: `Tw2CarbonLightCollector.Collect` stores the
            // reference it is given, so a shared scratch row would leave every
            // collected light as a copy of the last one. Carbon can reuse its own
            // because `Tr2LightManager::AddLight` takes the row by value.
            const record = CreateLightRecord();
            AsPerPointLightData(record, dataCopy, light.boneMatrix, features, shadowQuality);
            record.lightType = Tr2Light.POINT_LIGHT;
            collector.Collect([ record ]);
        }
    }

    static Item = EvePlaneSetItem;

    /**
     * Alpha multiplier
     * @type {number}
     */
    static alphaMultiplier = 1;

    /**
     * Vertex declarations
     * @type {*[]}
     */
    /**
     * Floats per vertex, and the single source of truth for the draw stride.
     * 8 x vec4, then TEXCOORD 7 (4) and TEXCOORD 8 (4).
     * @type {Number}
     */
    static vertexSize = 40;

    static vertexDeclarations = [
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "COLOR", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 4 },
        // Carbon packs these four as a UBYTE_4 (`EvePlaneSet.cpp:167`):
        // index, boneIndex, maskMapAtlasIndex, pickBufferID. The fourth was
        // missing, so a dx11 shader reading it got GL default w of 1.0.
        { usage: "TEXCOORD", usageIndex: 7, elements: 4 },
        // blinkData - [rate, phase, dutyCycle, blinkMode]
        // (`EvePlaneSetItem.h:47`, declared at `EvePlaneSet.cpp:166`).
        //
        // This stream was ABSENT entirely. A missing input is not an error in
        // `Tw2VertexDeclaration.SetPartialDeclaration` - it disables the attribute
        // and feeds it `vertexAttrib4f(0,0,0,0)`, silently - so on `effect.dx11`,
        // whose Carbon shaders declare it, every plane got zeroed blink data. The
        // legacy gles2 shaders never declared it, which is why gles2 was fine and
        // this read as a backend bug. Plane sets that play video are these same
        // objects, so they went dark for the same reason.
        { usage: "TEXCOORD", usageIndex: 8, elements: 4 }
    ];

}

