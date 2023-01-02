import { meta } from "utils";
import { device } from "global";
import { mat4, num, vec3, vec4, sph3, box3 } from "math";
import { Tw2VertexDeclaration, Tw2RenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";
import { assignIfExists } from "utils";
import { Tw2Effect } from "core/mesh";


class EveSpriteSetBatch extends Tw2RenderBatch
{

    boosterGlow = false;
    spriteSet = null;
    world = null;
    boosterGain = 0;
    warpIntensity = 0;


    /**
     * Commits the sprite set
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if rendered
     */
    Commit(technique)
    {
        if (this.boosterGlow)
        {
            return this.spriteSet.RenderBoosterGlow(technique, this.world, this.boosterGain, this.warpIntensity);
        }

        return this.spriteSet.Render(technique, this.world, this.perObjectData);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.spriteSet.effect && this.spriteSet.effect.HasTechnique(technique);
    }

}


@meta.type("EveSpriteSetItem", true)
export class EveSpriteSetItem extends EveObjectSetItem
{

    @meta.string
    name = "";

    @meta.float
    blinkPhase = 0;

    @meta.float
    blinkRate = 0;

    @meta.uint
    boneIndex = -1;

    @meta.color
    color = vec4.create();

    @meta.float
    falloff = 0;

    @meta.float
    intensity = 1;

    @meta.float
    maxScale = 0;

    @meta.float
    minScale = 0;

    @meta.vector3
    position = vec3.create();

    @meta.color
    warpColor = vec4.create();

    @meta.uint
    groupIndex = -1;

    // ccpwgl only

    @meta.uint
    colorType = -1;

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
     * Fires when rebuild by the parent
     * @param parent
     */
    OnRebuiltByParent(parent)
    {
        this._parent = parent;
        this._bone = parent ? parent.GetBone(this.boneIndex) : null;
        this._dirty = false;
    }

    /**
     * Updates the world transform
     * @param parentTransform
     */
    UpdateWorldPosition(parentTransform)
    {
        vec3.copy(this._worldPosition, this.position);
        if (this._bone) vec3.transformMat4(this._worldPosition, this._worldPosition, this._bone.offsetTransform);
        vec3.transformMat4(this._worldPosition, this._worldPosition, parentTransform);
    }

    /**
     * Gets the item's bounding box
     * @param {box3} out
     * @returns {box3} out
     */
    GetBoundingBox(out)
    {
        return box3.fromSph3(out, this.GetBoundingSphere(EveObjectSet.global.sph3_0));
    }

    /**
     * Gets the item's bounding sphere
     * @param {sph3} out
     * @returns {sph3} out
     */
    GetBoundingSphere(out)
    {
        sph3.fromPositionRadius(out, this.position, this.minScale * EveSpriteSet.itemBoundsScaleMultiplier);
        if (this._bone) sph3.transformMat4(out, out, this._bone.offsetTransform);
        return out;
    }

    /**
     * Gets the item's local transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        mat4.identity(m);
        m[12] = this.position[0];
        m[13] = this.position[1];
        m[14] = this.position[2];
        if (this._bone) mat4.multiply(m, this._bone.offsetTransform, m);
        return m;
    }

    /**
     * World position as calculated for quads
     * @type {null|vec3}
     * @private
     */
    _worldPosition = null;

    /**
     * Gets the sprite's world position
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetWorldPosition(out)
    {
        // Check if already calculated for quads, when visible
        if (this._worldPosition && this.display)
        {
            return vec3.copy(out, this._worldPosition);
        }

        if (!this._parent)
        {
            vec3.set(out, 0,0,0);
            throw new Error("Parent not defined");
        }

        vec3.copy(out, this.position);
        if (this._bone) vec3.transformMat4(out, out, this._bone.offsetTransform);
        return vec3.transformMat4(out, out, this._parent.GetParentTransformReference());
    }

}


@meta.type("EveSpriteSet", true)
export class EveSpriteSet extends EveObjectSet
{

    @meta.string
    name = "";

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.boolean
    skinned = false;

    @meta.boolean
    useQuads = null;

    _vertexBuffer = null;
    _indexBuffer = null;
    _instanceBuffer = null;
    _decl = null;
    _vdecl = Tw2VertexDeclaration.from([ { usage: "TEXCOORD", usageType: 5, elements: 1 } ]);
    _worldSpriteScale = 1;
    _randomness = num.randomFloat(0, 0.2);

    /**
     * Alias for this.items
     * @returns {Array}
     */
    @meta.list("EveSpriteSetItem")
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
     * Use instanced rendering or 'quad' rendering
     * @param {Boolean} useQuads - Use quad rendering (CPU transform)
     */
    UseQuads(useQuads)
    {
        this.useQuads = useQuads;
        this._decl = Tw2VertexDeclaration.from(useQuads ? EveSpriteSet.quadVertexDeclarations : EveSpriteSet.vertexDeclarations);
        this._dirty = true;
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Array<Tw2Bone>} bones
     * @param {Number} spriteScale
     */
    UpdateViewDependentData(parentTransform, bones, spriteScale)
    {
        if (!this.display) return;

        if (this._worldSpriteScale !== spriteScale)
        {
            this._worldSpriteScale = spriteScale;
            this._dirty = true;
        }

        super.UpdateViewDependentData(parentTransform, bones);
    }

    /**
     * Unloads the sprite set's buffers
     * @param {Object} [opt]
     */
    Unload(opt)
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

        super.Unload(opt);
    }

    /**
     * Rebuilds the sprite set's buffers
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        this.RebuildItems(opt);

        const itemCount = this._visibleItems.length;
        if (!itemCount)
        {
            super.Rebuild(opt);
            return;
        }

        const { gl } = device;

        if (this.useQuads)
        {
            this._vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 1, 2, 2, 3, 0 ]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this._instanceBuffer = gl.createBuffer();
            super.Rebuild(opt);
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
                array[vtxOffset + 5] = item.color[0] * item.intensity;
                array[vtxOffset + 6] = item.color[1] * item.intensity;
                array[vtxOffset + 7] = item.color[2] * item.intensity;
                array[vtxOffset + 8] = item.blinkPhase;
                array[vtxOffset + 9] = item.blinkRate + this._randomness;
                array[vtxOffset + 10] = item.minScale * this._worldSpriteScale;
                array[vtxOffset + 11] = item.maxScale * this._worldSpriteScale;
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

        super.Rebuild();
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     * @returns {Boolean} true if batches accumulated
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
            batch.mode = device.RM_ADDITIVE;
            accumulator.Commit(batch);
            return true;
        }
        return false;
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

        if (!this.display || !this.effect || !this.effect.IsGood() || !this._indexBuffer || !this._vertexBuffer)
        {
            return false;
        }

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
        if (!this.display || !this.effect || !this.effect.IsGood() || !this._instanceBuffer || !this._vertexBuffer)
        {
            return false;
        }

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

            // Todo: Just use stored _worldTransform or must it be unskinned?

            vec3.transformMat4(pos, item.position, world);
            array[index++] = pos[0];
            array[index++] = pos[1];
            array[index++] = pos[2];
            array[index++] = world[8];
            array[index++] = item.blinkPhase;
            array[index++] = world[9];
            array[index++] = item.minScale * this._worldSpriteScale;
            array[index++] = item.maxScale * this._worldSpriteScale;
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
        if (!this.display || !this.effect || !this.effect.IsGood() || !this._instanceBuffer || !this._vertexBuffer)
        {
            return false;
        }

        const
            d = device,
            gl = d.gl,
            itemCount = this._visibleItems.length,
            array = new Float32Array(17 * itemCount);

        d.SetStandardStates(d.RM_ADDITIVE);

        let index = 0;
        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];

            if (!item._worldPosition) item._worldPosition = vec3.create();
            if (item._bone) vec3.transformMat4(item._worldPosition, item.position, item._bone.offsetTransform);
            else vec3.copy(item._worldPosition, item.position);
            vec3.transformMat4(item._worldPosition, item._worldPosition, this._parentTransform);

            array[index++] = item._worldPosition[0];
            array[index++] = item._worldPosition[1];
            array[index++] = item._worldPosition[2];
            array[index++] = 1;
            array[index++] = item.blinkPhase;
            array[index++] = item.blinkRate;
            array[index++] = item.minScale * this._worldSpriteScale;
            array[index++] = item.maxScale * this._worldSpriteScale;
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
            assignIfExists(item, values, [ "name", "intensity", "skinned", "useQuads" ]);

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
     * Scales the bounds
     * @type {number}
     */
    static itemBoundsScaleMultiplier = 1.0;

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
        { usage: "TEXCOORD", usageIndex: 5, elements: 2 },
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "COLOR", usageIndex: 0, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 1 }
    ];

    /**
     * cpu transform vertex declarations
     * @type {*[]}
     */
    static quadVertexDeclarations = [
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 2 },
        { usage: "COLOR", usageIndex: 0, elements: 4 },
        { usage: "COLOR", usageIndex: 1, elements: 4 }
    ];

}
