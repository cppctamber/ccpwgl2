import {vec3, vec4, quat, mat4, util, device} from "../../global";
import {Tw2VertexDeclaration, Tw2RenderBatch} from "../../core";
import {EveObjectSet, EveObjectSetItem} from "./EveObjectSet";
import {assignIfExists, get} from "../../global/util";
import {Tw2Effect} from "../../core/mesh";

/**
 * Plane set render batch
 * @ccp N/A
 * @property {EvePlaneSet} planeSet
 */
export class EvePlaneSetBatch extends Tw2RenderBatch
{

    planeSet = null;


    /**
     * Commits the plan set
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        this.planeSet.Render(technique);
    }

}


/**
 * Plane set item
 * TODO: Identify if "boneIndex" is deprecated
 * TODO: Identify if "groupIndex" is deprecated
 * TODO: Replace "transform" with "localTransform" ?
 * If "boneIndex" and "groupIndex" are just used by the EveSOF, we may need to record this information if
 * we are going to convert this object back into a EveSOF object
 * @ccp EvePlaneSetItem
 *
 * @property {String} name          -
 * @property {vec4} color           -
 * @property {vec4} layer1Scroll    -
 * @property {vec4} layer1Transform -
 * @property {vec4} layer2Scroll    -
 * @property {vec4} layer2Transform -
 * @property {Number} maskAtlasID   -
 * @property {vec3} position        -
 * @property {quat} rotation        -
 * @property {vec3} scaling         -
 * @property {Number} boneIndex     -
 * @property {Boolean} display      -
 * @property {Number} groupIndex    -
 * @property {mat4} transform       -
 */
export class EvePlaneSetItem extends EveObjectSetItem
{
    // ccp
    name = "";
    color = vec4.create();
    layer1Scroll = vec4.create();
    layer1Transform = vec4.create();
    layer2Scroll = vec4.create();
    layer2Transform = vec4.create();
    maskAtlasID = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

    // ccpwgl
    boneIndex = 0; // Should this be -1 by default?
    groupIndex = -1;
    transform = mat4.create();

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.translation, this.scaling);
        this._dirty = true;
    }

    /**
     * Creates a plane set item from an object
     * @param {*} [values]
     * @returns {EvePlaneSetItem}
     */
    static from(values)
    {
        const item = new EvePlaneSetItem();

        if (values)
        {
            util.assignIfExists(item, values, [
                "name", "display", "boneIndex", "groupIndex", "position", "scaling", "rotation", "transform",
                "color", "layer1Transform", "layer2Transform", "layer1Scroll", "layer2Scroll", "maskAtlasID"
            ]);

            // Allow alias for maskAtlasID
            if (values.maskMapAtlasIndex !== undefined)
            {
                item.maskAtlasID = values.maskMapAtlasIndex;
            }
        }
        return item;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["color", r.color],
            ["layer1Scroll", r.vector4],
            ["layer1Transform", r.vector4],
            ["layer2Scroll", r.vector4],
            ["layer2Transform", r.vector4],
            ["maskAtlasID", r.uint],
            ["name", r.string],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
        ];
    }

}


/**
 * Plane set
 * Todo: Implement "hideOnLowQuality"
 * Todo: Implement "pickBufferID" (Assuming we will add picking)
 * @ccp EvePlaneSet
 *
 * @property {String} name                     -
 * @property {Tw2Effect} effect                -
 * @property {Boolean} hideOnLowQuality        -
 * @property {Number} pickBufferID             -
 * @property {Array.<EveObjectSetItem>} planes -
 * @property {Boolean} display                 -
 * @property {Number} _time                    -
 * @property {WebGLBuffer} _vertexBuffer       -
 * @property {WebGLBuffer} _indexBuffer        -
 * @property {Tw2VertexDeclaration} _decl      -
 */
export class EvePlaneSet extends EveObjectSet
{
    // ccp
    name = "";
    effect = null;
    hideOnLowQuality = false;
    pickBufferID = 0;

    // ccpwgl
    _time = 0;
    _vertexBuffer = null;
    _indexBuffer = null;
    _decl = Tw2VertexDeclaration.from(EvePlaneSet.vertexDeclarations);

    /**
     * Alias for this.items
     * @returns {Array}
     */
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
    GetResources(out=[])
    {
        if (this.effect) this.effect.GetResources(out);
        return out;
    }

    /**
     * Per frame update
     * @param {Number} dt - Delta Time
     * @param {mat4} [parentMatrix]
     */
    Update(dt, parentMatrix)
    {
        this._time += dt;
        super.Update(dt);
    }

    /**
     * Unloads the set's buffers
     * @param {Boolean} [skipEvent]
     */
    Unload(skipEvent)
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

        super.Unload(skipEvent);
    }

    /**
     * Rebuilds the plane set's buffers
     */
    Rebuild()
    {
        this.Unload(true);
        this.RebuildItems();
        this._dirty = false;
        const itemCount = this._visibleItems.length;
        if (!itemCount)
        {
            super.Rebuild();
            return;
        }

        const
            vertexSize = 35,
            mat4_0 = EvePlaneSet.global.mat4_0;

        const array = new Float32Array(itemCount * 4 * vertexSize);
        for (let i = 0; i < itemCount; ++i)
        {
            const
                item = this._visibleItems[i],
                offset = i * 4 * vertexSize;

            array[offset + vertexSize - 3] = 0;
            array[offset + vertexSize + vertexSize - 3] = 1;
            array[offset + 2 * vertexSize + vertexSize - 3] = 2;
            array[offset + 3 * vertexSize + vertexSize - 3] = 3;

            const itemTransform = mat4.fromRotationTranslationScale(item.transform, item.rotation, item.position, item.scaling);

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
                array[vtxOffset + 15] = item.color[3];

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

        this._vertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

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

        this._indexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = itemCount * 6;

        super.Rebuild();
    }

    /**
     * Gets the plane set's render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._indexBuffer && this._vertexBuffer && this._visibleItems.length)
        {
            const batch = new EvePlaneSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.planeSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the plane set
     * @param {String} technique - technique name
     */
    Render(technique)
    {
        if (!this.effect || !this.effect.IsGood() || !this._vertexBuffer || !this._indexBuffer) return false;

        const
            d = device,
            gl = d.gl;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(d, this.effect.GetPassInput(technique, pass), 140)) return false;
            d.ApplyShadowState();
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
            assignIfExists(item, values, ["name", "display", "hideOnLowQuality"]);

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
        {usage: "TEXCOORD", usageIndex: 0, elements: 4},
        {usage: "TEXCOORD", usageIndex: 1, elements: 4},
        {usage: "TEXCOORD", usageIndex: 2, elements: 4},
        {usage: "COLOR",    usageIndex: 0, elements: 4},
        {usage: "TEXCOORD", usageIndex: 3, elements: 4},
        {usage: "TEXCOORD", usageIndex: 4, elements: 4},
        {usage: "TEXCOORD", usageIndex: 5, elements: 4},
        {usage: "TEXCOORD", usageIndex: 6, elements: 4},
        {usage: "TEXCOORD", usageIndex: 7, elements: 3}
    ];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["effect", r.object],
            ["hideOnLowQuality", r.boolean],
            ["name", r.string],
            ["pickBufferID", r.byte],
            ["planes", r.array]
        ];
    }

}
