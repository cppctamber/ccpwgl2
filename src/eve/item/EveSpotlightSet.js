import { meta, assignIfExists, isFunction } from "utils";
import { device } from "global";
import { vec3, vec4, mat4 } from "math";
import { Tw2VertexDeclaration, Tw2RenderBatch, Tw2Effect } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";


class EveSpotlightSetBatch extends Tw2RenderBatch
{

    spotlightSet = null;
    world = null;

    /**
     * Commits the spotlight set for rendering
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if something was rendered
     */
    Commit(technique)
    {
        // Todo: Set partial declaration instead of this
        if (this.spotlightSet.useQuads)
        {
            this.spotlightSet.RebuildVertexBuffers(this.world, this.perObjectData);
        }

        let didRender = false;
        if (this.spotlightSet.RenderCones(technique)) didRender = true;
        if (this.spotlightSet.RenderGlow(technique)) didRender = true;
        return didRender;
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        if (this.spotlightSet)
        {
            if (this.spotlightSet.coneEffect && this.spotlightSet.coneEffect.HasTechnique(technique))
            {
                return true;
            }

            if (this.spotlightSet.glowEffect && this.spotlightSet.glowEffect.HasTechnique(technique))
            {
                return true;
            }
        }
        return false;
    }

}


@meta.type("EveSpotlightSetItem", true)
export class EveSpotlightSetItem extends EveObjectSetItem
{

    _bone = null;// Testing


    @meta.string
    name = "";

    @meta.boolean
    boosterGainInfluence = false;

    @meta.uint
    boneIndex = 0;                  // retain from EveSOF?

    @meta.color
    coneColor = vec4.create();

    @meta.float
    coneIntensity = 0;              // Non-standard Faction intensity

    @meta.boolean
    display = true;

    @meta.color
    flareColor = vec4.create();

    @meta.float
    flareIntensity = 0;             // Non-standard faction intensity

    @meta.uint
    groupIndex = -1;

    @meta.color
    spriteColor = vec4.create();

    @meta.float
    spriteIntensity = 0;            // Non-standard Faction intensity

    @meta.vector3
    spriteScale = vec3.fromValues(1, 1, 1);

    @meta.matrix4
    transform = mat4.create();

    @meta.uint
    colorType = -1;


    /**
     * Gets the item's local transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        return mat4.copy(m, this.transform);
    }

}


@meta.type("EveSpotlightSet", true)
export class EveSpotlightSet extends EveObjectSet
{

    @meta.string
    name = "";

    @meta.struct("Tw2Effect")
    coneEffect = null;

    @meta.struct("Tw2Effect")
    glowEffect = null;

    @meta.float
    intensity = 1;

    @meta.boolean
    useQuads = false;

    @meta.boolean
    skinned = false;

    _coneVertexBuffer = null;
    _decl = Tw2VertexDeclaration.from(EveSpotlightSet.vertexDeclarations);
    _indexBuffer = null;
    _spriteVertexBuffer = null;
    _worldSpriteScale = 1;
    _indexOrder = [ 0, 1, 2, 2, 3, 0 ];

    /**
     * Alias for this.items
     * @returns {Array}
     */
    @meta.list("EveSpotlightSetItem")
    get spotlightItems()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set spotlightItems(arr)
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
        if (this.coneEffect) this.coneEffect.GetResources(out);
        if (this.glowEffect) this.glowEffect.GetResources(out);
        return out;
    }

    /**
     * Unloads the spotlight set's buffers
     * @param {Object} [opt]
     */
    Unload(opt)
    {
        if (this._coneVertexBuffer)
        {
            device.gl.deleteBuffer(this._coneVertexBuffer);
            this._coneVertexBuffer = null;
        }

        if (this._spriteVertexBuffer)
        {
            device.gl.deleteBuffer(this._spriteVertexBuffer);
            this._spriteVertexBuffer = null;
        }

        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        super.Unload(opt);
    }

    /**
     * Sets the world sprite scale
     * @param {Number} scale
     */
    SetWorldSpriteScale(scale)
    {
        if (this._worldSpriteScale !== scale)
        {
            this._worldSpriteScale = scale;
            this._dirty = true;
        }
    }

    /**
     * Sets the order of the index buffer
     * @param {Number} a
     * @param {Number} b
     * @param {Number} c
     * @param {Number} d
     * @param {Number} e
     * @param {Number} f
     */
    SetIndexOrder(a, b, c, d, e, f)
    {
        this._indexOrder[0] = a;
        this._indexOrder[1] = b;
        this._indexOrder[2] = c;
        this._indexOrder[3] = d;
        this._indexOrder[4] = e;
        this._indexOrder[5] = f;
        this._dirty = true;
    }

    /**
     * Alpha multiplier
     * @type {number}
     */
    static alphaMultiplier = 1;


    static global = {
        mat4_0 : mat4.create(),
        quadScratch: []
    };

    /**
     * Rebuilds vertex buffers
     * TODO: Do this properly
     * @param {mat4} [world]
     * @param {Tw2PerObjectData} [perObjectData]
     */
    RebuildVertexBuffers(world, perObjectData)
    {

        const
            itemCount = this._visibleItems.length,
            d = device,
            vertCount = 4,
            coneQuadCount = 4,
            coneVertexCount = itemCount * coneQuadCount * vertCount,
            vertexSize = 22,
            coneIndices = [ 1, 0, 2, 3 ],
            coneArray = new Float32Array(coneVertexCount * vertexSize),
            { quadScratch, mat4_0 } = EveSpotlightSet.global,
            bones = perObjectData ? perObjectData.vs.Get("JointMat") : null;

        let transforms = [];
        for (let i = 0; i < itemCount; i++)
        {
            const item = this._visibleItems[i];

            if (this.useQuads && world)
            {
                if (!quadScratch[i]) quadScratch[i] = mat4.create();
                const s = quadScratch[i];

                if (this.skinned && item.boneIndex >= 0)
                {
                    mat4.fromJointMatIndex(mat4_0, bones, item.boneIndex);
                    mat4.multiply(s, mat4_0, item.transform);
                    mat4.multiply(s, world, s);
                }
                else
                {
                    mat4.multiply(s, world, item.transform);
                }

                transforms.push(s);
            }
            else
            {
                transforms.push(item.transform);
            }
        }

        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            for (let q = 0; q < coneQuadCount; ++q)
            {
                for (let v = 0; v < vertCount; ++v)
                {
                    const offset = (i * coneQuadCount * vertCount + vertCount * q + v) * vertexSize;
                    coneArray[offset] = item.coneColor[0] * item.coneIntensity * this.intensity;
                    coneArray[offset + 1] = item.coneColor[1] * item.coneIntensity * this.intensity;
                    coneArray[offset + 2] = item.coneColor[2] * item.coneIntensity * this.intensity;
                    coneArray[offset + 3] = item.coneColor[3] * EveSpotlightSet.alphaMultiplier;

                    coneArray[offset + 4] = transforms[i][0];
                    coneArray[offset + 5] = transforms[i][4];
                    coneArray[offset + 6] = transforms[i][8];
                    coneArray[offset + 7] = transforms[i][12];

                    coneArray[offset + 8] = transforms[i][1];
                    coneArray[offset + 9] = transforms[i][5];
                    coneArray[offset + 10] = transforms[i][9];
                    coneArray[offset + 11] = transforms[i][13];

                    coneArray[offset + 12] = transforms[i][2];
                    coneArray[offset + 13] = transforms[i][6];
                    coneArray[offset + 14] = transforms[i][10];
                    coneArray[offset + 15] = transforms[i][14];

                    coneArray[offset + 16] = 1;
                    coneArray[offset + 17] = 1;
                    coneArray[offset + 18] = 1;

                    coneArray[offset + 19] = q * vertCount + coneIndices[v];
                    coneArray[offset + 20] = item.boneIndex;
                    coneArray[offset + 21] = item.boosterGainInfluence ? 255 : 0;
                }
            }
        }

        this._coneVertexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._coneVertexBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, coneArray, d.gl.STATIC_DRAW);
        this._coneVertexBuffer.count = itemCount * coneQuadCount * 6;

        const
            spriteQuadCount = 2,
            spriteVertexCount = itemCount * spriteQuadCount * vertCount,
            spriteArray = new Float32Array(spriteVertexCount * vertexSize),
            spriteIndexes = [ 1, 0, 2, 3 ];

        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            for (let q = 0; q < spriteQuadCount; ++q)
            {
                for (let v = 0; v < vertCount; ++v)
                {
                    const offset = (i * spriteQuadCount * vertCount + vertCount * q + v) * vertexSize;
                    if (q % 2 === 0)
                    {
                        spriteArray[offset] = item.spriteColor[0] * item.spriteIntensity * this.intensity;
                        spriteArray[offset + 1] = item.spriteColor[1] * item.spriteIntensity * this.intensity;
                        spriteArray[offset + 2] = item.spriteColor[2] * item.spriteIntensity * this.intensity;
                        spriteArray[offset + 3] = item.spriteColor[3]; // Not needed?

                        spriteArray[offset + 16] = item.spriteScale[0] * this._worldSpriteScale;
                        spriteArray[offset + 17] = 1;
                        spriteArray[offset + 18] = 1;
                    }
                    else
                    {
                        spriteArray[offset] = item.flareColor[0] * item.flareIntensity * this.intensity;
                        spriteArray[offset + 1] = item.flareColor[1] * item.flareIntensity * this.intensity;
                        spriteArray[offset + 2] = item.flareColor[2] * item.flareIntensity * this.intensity;
                        spriteArray[offset + 3] = item.flareColor[3]; // Not needed?

                        spriteArray[offset + 16] = 1;
                        spriteArray[offset + 17] = item.spriteScale[1] * this._worldSpriteScale;
                        spriteArray[offset + 18] = item.spriteScale[2] * this._worldSpriteScale;
                    }

                    spriteArray[offset + 4] = transforms[i][0];
                    spriteArray[offset + 5] = transforms[i][4];
                    spriteArray[offset + 6] = transforms[i][8];
                    spriteArray[offset + 7] = transforms[i][12];

                    spriteArray[offset + 8] = transforms[i][1];
                    spriteArray[offset + 9] = transforms[i][5];
                    spriteArray[offset + 10] = transforms[i][9];
                    spriteArray[offset + 11] = transforms[i][13];

                    spriteArray[offset + 12] = transforms[i][2];
                    spriteArray[offset + 13] = transforms[i][6];
                    spriteArray[offset + 14] = transforms[i][10];
                    spriteArray[offset + 15] = transforms[i][14];

                    spriteArray[offset + 19] = q * vertCount + spriteIndexes[v];
                    spriteArray[offset + 20] = item.boneIndex;
                    spriteArray[offset + 21] = item.boosterGainInfluence ? 255 : 0;
                }
            }
        }

        this._spriteVertexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._spriteVertexBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, spriteArray, d.gl.STATIC_DRAW);
        this._spriteVertexBuffer.count = itemCount * spriteQuadCount * 6;
    }

    /**
     * Rebuilds the spotlight set's buffers
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
            { gl } = device,
            coneQuadCount = 4;

        // Pool uses different order
        this._indexOrder[5] = this.useQuads ? 1 : 0;

        const order = this._indexOrder;
        const indexes = new Uint16Array(itemCount * coneQuadCount * 6);
        for (let i = 0; i < itemCount * coneQuadCount; ++i)
        {
            const
                offset = i * 6,
                vtxOffset = i * 4;

            indexes[offset] = vtxOffset + order[0];
            indexes[offset + 1] = vtxOffset + order[1]; //1;
            indexes[offset + 2] = vtxOffset + order[2]; //2;
            indexes[offset + 3] = vtxOffset + order[3]; //2;
            indexes[offset + 4] = vtxOffset + order[4]; //3;
            indexes[offset + 5] = vtxOffset + order[5]; //0 or 1
        }

        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = itemCount;

        if (!this.useQuads)
        {
            this.RebuildVertexBuffers();
        }
        
        super.Rebuild(opt);
    }

    /**
     * Gets the spotlight set's render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData, world)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._indexBuffer && this._indexBuffer.count && this._visibleItems.length)
        {
            const batch = new EveSpotlightSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.spotlightSet = this;
            batch.perObjectData = perObjectData;
            batch.world = world;
            batch.mode = device.RM_ADDITIVE;
            accumulator.Commit(batch);
            return true;
        }
        return false;
    }

    /**
     * Renders the spotlight set's cone effect
     * @param {String} technique - technique name
     * @returns {Boolean}
     */
    RenderCones(technique)
    {
        return EveSpotlightSet.Render(this, this.coneEffect, technique, this._coneVertexBuffer);
    }

    /**
     * Renders the spotlight set's glow effect
     * @param {String} technique - technique name
     * @returns {Boolean}
     */
    RenderGlow(technique)
    {
        return EveSpotlightSet.Render(this, this.glowEffect, technique, this._spriteVertexBuffer);
    }

    /**
     * Internal render function
     * @param {EveSpotlightSet} spotlightSet
     * @param {Tw2Effect} effect   - The Tw2Effect to render
     * @param {String} technique - technique name
     * @param {WebGLBuffer} buffer - A webgl buffer (ie. cone or glow buffer)
     * @returns {Boolean}
     * @private
     */
    static Render(spotlightSet, effect, technique, buffer)
    {
        if (!effect || !effect.IsGood() || !buffer || !spotlightSet._indexBuffer) return false;

        const
            d = device,
            gl = d.gl,
            stride = 22 * 4;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spotlightSet._indexBuffer);

        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!spotlightSet._decl.SetDeclaration(d, effect.GetPassInput(technique, pass), stride)) return false;
            d.ApplyShadowState();
            d.gl.drawElements(gl.TRIANGLES, buffer["count"], gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }

    /**
     * Creates an eve spotlight set from a plain object
     * @param {*} [values]
     * @param {*} [opt]
     * @returns {EveSpotlightSet}
     */
    static from(values, opt)
    {
        const item = new EveSpotlightSet();

        if (values)
        {
            assignIfExists(item, values, [ "name", "display", "intensity" ]);

            if (values.coneEffect)
            {
                if (isFunction(values.coneEffect))
                {
                    item.coneEffect = values.coneEffect;
                }
                else
                {
                    item.coneEffect = Tw2Effect.from(values.coneEffect);
                }
            }

            if (values.glowEffect)
            {
                if (isFunction(values.glowEffect))
                {
                    item.glowEffect = values.glowEffect;
                }
                else
                {
                    item.glowEffect = Tw2Effect.from(values.glowEffect);
                }
            }

            if (values.items)
            {
                for (let i = 0; i < values.items.length; i++)
                {
                    item.CreateItem(values.items[i]);
                }
            }
        }

        if (!opt || !opt.skipUpdate)
        {
            item.Initialize();
        }

        return item;
    }

    /**
     * Spotlight set item constructor
     * @type {EveSpotlightSetItem}usageIndex:
     elements:    */
    static Item = EveSpotlightSetItem;

    /**
     * Vertex declarations
     * @type {*[]}
     */
    static vertexDeclarations = [
        { usage: "COLOR", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 3 }
    ];

}


