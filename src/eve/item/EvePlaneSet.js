import { meta, assignIfExists } from "utils";
import { device } from "global";
import { vec3, vec4, quat, mat4 } from "math";
import { Tw2VertexDeclaration, Tw2RenderBatch, Tw2Effect } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";


class EvePlaneSetBatch extends Tw2RenderBatch
{

    planeSet = null;


    /**
     * Commits the plan set
     * @param {String} [technique] - technique name
     */
    Commit(technique)
    {
        this.planeSet.Render(technique);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.planeSet && this.planeSet.effect && this.planeSet.effect.HasTechnique(technique);
    }

}


@meta.type("EvePlaneSetItem", true)
export class EvePlaneSetItem extends EveObjectSetItem
{

    @meta.string
    name = "";

    @meta.notImplemented
    @meta.float
    blinkRate = 0;

    @meta.notImplemented
    @meta.float
    blinkPhase = 0;

    @meta.notImplemented
    @meta.uint
    blinkMode = 0;

    @meta.notImplemented
    @meta.float
    dutyCycle = 0;

    @meta.notImplemented
    @meta.float
    rate = 0;

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

    @meta.uint
    boneIndex = 0;

    @meta.uint
    @meta.todo("Identify if this is required anywhere apart from the EVESOF, or if it can be deprecated")
    groupIndex = -1;

    // Testing

    @meta.uint
    colorType = -1;


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
     * Gets the object's transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        return mat4.fromRotationTranslationScale(m, this.rotation, this.position, this.scaling);
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
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


@meta.type("EvePlaneSet", true)
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
     * Alpha multiplier
     * @type {number}
     */
    static alphaMultiplier = 1;

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
            vertexSize = 35,
            array = new Float32Array(itemCount * 4 * vertexSize);

        for (let i = 0; i < itemCount; ++i)
        {
            const
                item = this._visibleItems[i],
                offset = i * 4 * vertexSize;

            array[offset + vertexSize - 3] = 0;
            array[offset + vertexSize + vertexSize - 3] = 1;
            array[offset + 2 * vertexSize + vertexSize - 3] = 2;
            array[offset + 3 * vertexSize + vertexSize - 3] = 3;

            const itemTransform = mat4.fromRotationTranslationScale(EveObjectSet.global.mat4_0, item.rotation, item.position, item.scaling);

            for (let j = 0; j < 4; ++j)
            {
                const vtxOffset = offset + j * vertexSize;
                array[vtxOffset] = itemTransform[0];
                array[vtxOffset + 1] = itemTransform[4];
                array[vtxOffset + 2] = itemTransform[8];
                array[vtxOffset + 3] = itemTransform[12];
                array[vtxOffset + 4] = itemTransform[1];
                array[vtxOffset + 5] = itemTransform[5];
                array[vtxOffset + 6] = itemTransform[9];
                array[vtxOffset + 7] = itemTransform[13];
                array[vtxOffset + 8] = itemTransform[2];
                array[vtxOffset + 9] = itemTransform[6];
                array[vtxOffset + 10] = itemTransform[10];
                array[vtxOffset + 11] = itemTransform[14];

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

                array[vtxOffset + 33] = item.boneIndex;
                array[vtxOffset + 34] = item.maskAtlasID;
            }
        }

        const { gl } = device;
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

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

        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = itemCount * 6;

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
            if (!this._decl.SetDeclaration(device, this.effect.GetPassInput(technique, pass), 140)) return false;
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
    static Item = EvePlaneSetItem;

    /**
     * Vertex declarations
     * @type {*[]}
     */
    static vertexDeclarations = [
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "COLOR", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 7, elements: 3 }
    ];

}

