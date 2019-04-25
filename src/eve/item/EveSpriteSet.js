import {vec3, vec4, util, device} from "../../global";
import {Tw2VertexDeclaration, Tw2RenderBatch} from "../../core";
import {EveObjectSet, EveObjectSetItem} from "./EveObjectSet";
import {assignIfExists} from "../../global/util";
import {Tw2Effect} from "../../core/mesh";

/**
 * Sprite set render batch
 * @ccp N/A
 *
 * @property {Boolean} boosterGlow
 * @property {EveSpriteSet} spriteSet
 * @property {mat4} world
 * @property {Number}
 * @property {Number}
 */
export class EveSpriteSetBatch extends Tw2RenderBatch
{

    boosterGlow = false;
    spriteSet = null;
    world = null;
    boosterGain = 0;
    warpIntensity = 0;


    /**
     * Commits the sprite set
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        if (this.boosterGlow)
        {
            this.spriteSet.RenderBoosterGlow(technique, this.world, this.boosterGain, this.warpIntensity);
        }
        else
        {
            this.spriteSet.Render(technique, this.world, this.perObjectData);
        }
    }

}


/**
 * Sprite
 * @ccp EveSpriteSetItem
 *
 * @property {String} name       -
 * @property {Number} blinkPhase -
 * @property {Number} blinkRate  -
 * @property {Number} boneIndex  -
 * @property {vec4} color        -
 * @property {Number} falloff    -
 * @property {Number} maxScale   -
 * @property {Number} minScale   -
 * @property {vec3} position     -
 * @property {vec4} warpColor    -
 */
export class EveSpriteSetItem extends EveObjectSetItem
{

    name = "";
    blinkPhase = 0;
    blinkRate = 0;
    boneIndex = 0;
    color = vec4.create();
    falloff = 0;
    maxScale = 0;
    minScale = 0;
    position = vec3.create();
    warpColor = vec4.create();

    // ccpwgl
    groupIndex = -1;            // Retain from EveSOF?
    groupName = "";

    /**
     * Creates a sprite set item from an object
     * @param {*} [values]
     * @returns {EveSpriteSetItem}
     */
    static from(values)
    {
        const item = new this();
        if (values)
        {
            util.assignIfExists(item, values, [
                "name", "display", "blinkRate", "blinkPhase", "minScale", "maxScale",
                "falloff", "boneIndex", "groupIndex", "position", "color", "warpColor",
                "groupName"
            ]);
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
            ["blinkPhase", r.float],
            ["blinkRate", r.float],
            ["boneIndex", r.uint],
            ["color", r.color],
            ["falloff", r.float],
            ["maxScale", r.float],
            ["minScale", r.float],
            ["name", r.string],
            ["position", r.vector3],
            ["warpColor", r.color]
        ];
    }

}


/**
 * Sprite set
 * @ccp EveSpriteSet
 *
 * @property {String} name                      - The sprite set's name
 * @property {Tw2Effect} effect                 - The sprite set's effect
 * @property {Number} intensity                 - The sprite set's intensity
 * @property {Boolean} skinned                  - Use bone transforms (when useQuads is true)
 * @property {?Boolean} useQuads                - Use quad rendering (CPU transform)
 * @property {Number} _time                     - The sprite set's internal time
 * @property {WebGLBuffer} _vertexBuffer        - The sprite set's vertex buffer
 * @property {WebGLBuffer} _indexBuffer         - The sprite set's index buffer
 * @property {Tw2VertexDeclaration} _decl       - The sprite set's vertex declarations
 * @property {Tw2VertexDeclaration} _vdecl      -
 */
export class EveSpriteSet extends EveObjectSet
{

    name = "";
    effect = null;
    intensity = 0;
    skinned = false;

    // ccpwgl
    useQuads = null;
    _time = 0;
    _vertexBuffer = null;
    _indexBuffer = null;
    _instanceBuffer = null;
    _decl = null;
    _vdecl = Tw2VertexDeclaration.from([{usage: "TEXCOORD", usageType: 5, elements: 1}]);

    /**
     * Alias for this.items
     * @returns {Array}
     */
    get sprites()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set sprites(arr)
    {
        this.items = arr;
    }

    /**
     * Initializes the object
     */
    Initialize()
    {
        this.UseQuads(!!this.useQuads);
        this.Rebuild();
    }

    /**
     * Use instanced rendering or 'quad' rendering
     * @param {Boolean} useQuads - Use quad rendering (CPU transform)
     */
    UseQuads(useQuads)
    {
        this.useQuads = useQuads;
        this._decl = Tw2VertexDeclaration.from(useQuads ?  EveSpriteSet.quadVertexDeclarations : EveSpriteSet.vertexDeclarations);
        this._dirty = true;
    }

    /**
     * Per frame update
     * @param {Number} dt - Delta time
     * @param {mat4} [parentMatrix]
     */
    Update(dt, parentMatrix)
    {
        this._time += dt;

        if (this._dirty)
        {
            this.Rebuild();
        }
    }

    /**
     * Unloads the sprite set's buffers
     */
    Unload()
    {
        const gl = device.gl;

        if (this._vertexBuffer)
        {
            gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        // Standard
        if (this._indexBuffer)
        {
            gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        // Quad
        if (this._instanceBuffer)
        {
            gl.deleteBuffer(this._instanceBuffer);
            this._instanceBuffer = null;
        }
    }

    /**
     * Rebuilds the sprite set's buffers
     */
    Rebuild()
    {
        this.RebuildItems();
        this._dirty = false;
        const itemCount = this._visibleItems.length;
        if (!itemCount) return;

        const gl = device.gl;

        if (this.useQuads)
        {
            this._vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 2, 2, 3, 0]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this._instanceBuffer = gl.createBuffer();
            return;
        }

        const
            vertexSize = 13,
            array = new Float32Array(itemCount * 4 * vertexSize);

        for (let i = 0; i < itemCount; ++i)
        {
            const
                item = this._visibleItems[i],
                offset = i * 4 * vertexSize;

            array[offset] = 0;
            array[offset + vertexSize] = 1;
            array[offset + 2 * vertexSize] = 2;
            array[offset + 3 * vertexSize] = 3;

            for (let j = 0; j < 4; ++j)
            {
                const vtxOffset = offset + j * vertexSize;
                array[vtxOffset + 1] = item.boneIndex;
                array[vtxOffset + 2] = item.position[0];
                array[vtxOffset + 3] = item.position[1];
                array[vtxOffset + 4] = item.position[2];
                array[vtxOffset + 5] = item.color[0];
                array[vtxOffset + 6] = item.color[1];
                array[vtxOffset + 7] = item.color[2];
                array[vtxOffset + 8] = item.blinkPhase;
                array[vtxOffset + 9] = item.blinkRate;
                array[vtxOffset + 10] = item.minScale;
                array[vtxOffset + 11] = item.maxScale;
                array[vtxOffset + 12] = item.falloff;
            }
        }

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
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     */
    GetBatches(mode, accumulator, perObjectData, world)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._vertexBuffer && this._visibleItems.length)
        {
            const batch = new EveSpriteSetBatch();
            batch.world = world;
            batch.renderMode = device.RM_ADDITIVE;
            batch.spriteSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Gets render batches for booster glows
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     * @param {Number} boosterGain
     * @param {Number} warpIntensity
     */
    GetBoosterGlowBatches(mode, accumulator, perObjectData, world, boosterGain, warpIntensity)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._vertexBuffer && this._visibleItems.length)
        {
            const batch = new EveSpriteSetBatch();
            batch.boosterGlow = true;
            batch.world = world;
            batch.boosterGain = boosterGain;
            batch.warpIntensity = warpIntensity;
            batch.renderMode = device.RM_ADDITIVE;
            batch.spriteSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the sprite set
     * @param {String} technique - technique name
     * @param {mat4} world
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean}
     */
    Render(technique, world, perObjectData)
    {
        if (this.useQuads)
        {
            return this.RenderQuads(technique, world, perObjectData);
        }

        if (!this.effect || !this.effect.IsGood() || !this._indexBuffer || !this._vertexBuffer) return false;

        const
            d = device,
            gl = d.gl;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(d, this.effect.GetPassInput(technique, pass), 52)) return false;
            d.ApplyShadowState();
            gl.drawElements(gl.TRIANGLES, this._indexBuffer.count, gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }

    /**
     * Renders the sprite set as booster glow
     * @param {String} technique - technique name
     * @param {mat4} world
     * @param {Number} boosterGain
     * @param {Number} warpIntensity
     * @returns {Boolean}
     */
    RenderBoosterGlow(technique, world, boosterGain, warpIntensity)
    {
        if (!this.effect || !this.effect.IsGood() || !this._instanceBuffer || !this._vertexBuffer) return false;

        const
            d = device,
            gl = d.gl,
            pos = EveObjectSet.global.vec3_0,
            itemCount = this._visibleItems.length,
            array = new Float32Array(17 * itemCount);

        d.SetStandardStates(d.RM_ADDITIVE);

        let index = 0;
        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            vec3.transformMat4(pos, item.position, world);
            array[index++] = pos[0];
            array[index++] = pos[1];
            array[index++] = pos[2];
            array[index++] = world[8];
            array[index++] = item.blinkPhase;
            array[index++] = world[9];
            array[index++] = item.minScale;
            array[index++] = item.maxScale;
            array[index++] = world[10];
            array[index++] = item.color[0];
            array[index++] = item.color[1];
            array[index++] = item.color[2];
            array[index++] = boosterGain;
            array[index++] = item.warpColor[0];
            array[index++] = item.warpColor[1];
            array[index++] = item.warpColor[2];
            array[index++] = warpIntensity;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            const passInput = this.effect.GetPassInput(technique, pass);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            this._vdecl.SetPartialDeclaration(d, passInput, 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
            const resetData = this._decl.SetPartialDeclaration(d, passInput, 17 * 4, 0, 1);
            d.ApplyShadowState();
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, itemCount);
            this._decl.ResetInstanceDivisors(d, resetData);
        }

        return true;
    }

    /**
     * Renders the sprite set with pre-transformed quads
     * @param {String} technique - technique name
     * @param {mat4} world
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean}
     */
    RenderQuads(technique, world, perObjectData)
    {
        if (!this.effect || !this.effect.IsGood() || !this._instanceBuffer || !this._vertexBuffer) return false;

        const
            d = device,
            gl = d.gl,
            itemCount = this._visibleItems.length,
            array = new Float32Array(17 * itemCount),
            pos = EveObjectSet.global.vec3_0,
            bones = perObjectData.vs.Get("JointMat");

        d.SetStandardStates(d.RM_ADDITIVE);

        let index = 0;
        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            if (this.skinned)
            {
                const offset = item.boneIndex * 12;
                pos[0] = bones[offset] * item.position[0] + bones[offset + 1] * item.position[1] + bones[offset + 2] * item.position[2] + bones[offset + 3];
                pos[1] = bones[offset + 4] * item.position[0] + bones[offset + 5] * item.position[1] + bones[offset + 6] * item.position[2] + bones[offset + 7];
                pos[2] = bones[offset + 8] * item.position[0] + bones[offset + 9] * item.position[1] + bones[offset + 10] * item.position[2] + bones[offset + 11];
                vec3.transformMat4(pos, pos, world);
            }
            else
            {
                vec3.transformMat4(pos, item.position, world);
            }

            array[index++] = pos[0];
            array[index++] = pos[1];
            array[index++] = pos[2];
            array[index++] = 1;
            array[index++] = item.blinkPhase;
            array[index++] = item.blinkRate;
            array[index++] = item.minScale;
            array[index++] = item.maxScale;
            array[index++] = item.falloff;
            array[index++] = item.color[0];
            array[index++] = item.color[1];
            array[index++] = item.color[2];
            array[index++] = 1;
            array[index++] = item.warpColor[0];
            array[index++] = item.warpColor[1];
            array[index++] = item.warpColor[2];
            array[index++] = 1;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            const passInput = this.effect.GetPassInput(technique, pass);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            this._vdecl.SetPartialDeclaration(d, passInput, 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
            const resetData = this._decl.SetPartialDeclaration(d, passInput, 17 * 4, 0, 1);
            d.ApplyShadowState();
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, itemCount);
            this._decl.ResetInstanceDivisors(d, resetData);
        }

        return true;
    }

    /**
     * Creates an eve sprite set from a plain object
     * @param {*} values
     * @param {*} [options]
     * @returns {EveSpriteSet}
     */
    static from(values, options)
    {
        const item = new EveSpriteSet();

        if (values)
        {
            assignIfExists(item, values, ["name", "intensity", "skinned", "useQuads"]);

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
     * The sprite set's item constructor
     * @type {EveSpriteSetItem}
     */
    static Item = EveSpriteSetItem;

    /**
     * Vertex declarations
     * @type {*[]}
     */
    static vertexDeclarations = [
        {usage: "TEXCOORD", usageIndex: 5, elements: 2},
        {usage: "POSITION", usageIndex: 0, elements: 3},
        {usage: "COLOR", usageIndex: 0, elements: 3},
        {usage: "TEXCOORD", usageIndex: 0, elements: 1},
        {usage: "TEXCOORD", usageIndex: 1, elements: 1},
        {usage: "TEXCOORD", usageIndex: 2, elements: 1},
        {usage: "TEXCOORD", usageIndex: 3, elements: 1},
        {usage: "TEXCOORD", usageIndex: 4, elements: 1}
    ];

    /**
     * cpu transform vertex declarations
     * @type {*[]}
     */
    static quadVertexDeclarations = [
        {usage: "POSITION", usageIndex: 0, elements: 3},
        {usage: "TEXCOORD", usageIndex: 0, elements: 4},
        {usage: "TEXCOORD", usageIndex: 1, elements: 2},
        {usage: "COLOR", usageIndex: 0, elements: 4},
        {usage: "COLOR", usageIndex: 1, elements: 4}
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
            ["name", r.string],
            ["intensity", r.float],
            ["skinned", r.boolean],
            ["sprites", r.array]
        ];
    }

}
