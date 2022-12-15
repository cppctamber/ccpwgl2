import { meta, assignIfExists } from "utils";
import { device } from "global";
import { vec3, vec4, mat4, box3, sph3 } from "math";
import { Tw2VertexDeclaration, Tw2PerObjectData, Tw2RenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";
import { Tw2Effect } from "core/mesh";
import { EveSpriteSet } from "./EveSpriteSet";

/**
 * Booster render batch
 *
 * @property {EveBoosterSet} boosters
 */
export class EveBoosterBatch extends Tw2RenderBatch
{

    boosters = null;

    /**
     * Commits the batch
     * @param {String} [technique] - technique name
     */
    Commit(technique)
    {
        // ship data 2 is shared so return the value to what it was
        const
            shipData = this.perObjectData.ps.Get("Shipdata"),
            originalValue = shipData[2];

        shipData[2] = 0;
        let rv = this.boosters.Render(technique);
        shipData[2] = originalValue;
        return rv;
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.boosters && this.boosters.effect && this.boosters.effect.HasTechnique(technique);
    }

}


@meta.type("EveBoosterSetItem")
export class EveBoosterSetItem extends EveObjectSetItem
{

    @meta.string
    name = "";

    @meta.uint
    atlas0 = 0;

    @meta.uint
    atlas1 = 0;

    @meta.string
    locatorName = null;

    @meta.float
    seed = Math.random() * 7;

    @meta.matrix4
    transform = mat4.create();

    @meta.boolean
    updateFromLocator = false;

    @meta.plain
    visible = {
        glow: true,
        symHalo: true,
        halo: true,
        trail: true
    };

    @meta.float
    wavePhase = Math.random();

    /**
     * Gets the item's local matrix
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        return mat4.copy(m, this.transform);
    }

    /**
     * Gets the item's bounding box
     * @param {box3} out
     * @returns {box3} out
     */
    GetBoundingBox(out)
    {
        return box3.fromTransform(out, this.transform);
    }

    /**
     * Gets the item's position
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetPosition(out)
    {
        return mat4.getTranslation(out, this.transform);
    }

    /**
     * Gets the item's direction
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetDirection(out)
    {
        vec3.set(out, this.transform[8], this.transform[9], this.transform[10]);
        vec3.normalize(out, out);
        const scale = this.GetScale();
        if (scale < 3) vec3.scale(out, out, scale / 3);
        return out;
    }

    /**
     * Gets the item's scale
     * @returns {Number}
     */
    GetScale()
    {
        const tr = this.transform;
        return Math.max(vec3.length([ tr[0], tr[1], tr[2] ]), vec3.length([ tr[4], tr[5], tr[6] ]));
    }

}

/**
 * Todo: replace locator update with bones...
 */

@meta.type("EveBoosterSet", true)
export class EveBoosterSet extends EveObjectSet
{

    @meta.notImplemented
    @meta.boolean
    alwaysOn = true;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.color
    glowColor = vec4.create();

    @meta.struct("EveSpriteSet")
    glows = null;

    @meta.float
    glowScale = 1.0;

    @meta.color
    haloColor = vec4.create();

    @meta.float
    haloScaleX = 0.0; // 1.0; (ugly)

    @meta.float
    haloScaleY = 0.0; // 1.0; (ugly)

    @meta.notImplemented
    @meta.float
    maxVel = 250;

    @meta.float
    symHaloScale = 0.0; // 1.0 (ugly)

    @meta.color
    trailColor = vec4.create();

    @meta.vector4
    trailSize = vec4.create();

    @meta.color
    warpGlowColor = vec4.create();

    @meta.color
    warpHaloColor = vec4.create();

    @meta.float
    glowDistance = 2.5;

    @meta.float
    haloDistance = 3.01;

    @meta.float
    symHaloDistance = 0; //3; (ugly)

    @meta.plain
    visible = {
        glows: true,
        symHalos: true,
        halos: true,
        trails: true
    };

    _positions = null;
    _decl = Tw2VertexDeclaration.from(EveBoosterSet.vertexDeclarations);
    _perObjectData = Tw2PerObjectData.from(EveBoosterSet.perObjectData);
    _locatorDirty = true;

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
     * Check if any children have dirty bounds
     * @returns {boolean}
     */
    AreBoundsDirty()
    {
        if (this._boundsDirty) return true;

        for (let i = 0; i < this._visibleItems.length; i++)
        {
            if (this._visibleItems[i].AreBoundsDirty()) return true;
        }

        return this.glows ? this.glows.AreBoundsDirty() : false;
    }

    /**
     * Rebuilds the item's bounds
     */
    OnRebuildBounds()
    {
        box3.empty(this._boundingBox);
        sph3.empty(this._boundingSphere);

        if (!this._visibleItems.length || !this.glows)
        {
            this._boundsDirty = false;
            return;
        }

        const { box3_0 } = EveObjectSet.global;
        for (let i = 0; i < this._visibleItems.length; i++)
        {
            this._visibleItems[i].GetBoundingBox(box3_0);
            box3.union(this._boundingBox, this._boundingBox, box3_0);
        }

        if (this.glows)
        {
            this.glows.GetBoundingBox(box3_0);
            box3.union(this._boundingBox, this._boundingBox, box3_0);
        }

        sph3.fromBox3(this._boundingSphere, this._boundingBox);
        this._boundsDirty = false;
    }

    /**
     * Rebuilds a booster set's items
     * @param {Object} [opt
     */
    RebuildItems(opt)
    {
        const
            glows = this.glows,
            g = EveBoosterSet.global,
            spritePos = g.vec3_0;

        if (glows) glows.ClearItems({ skipUpdate: true });
        this._visibleItems = [];

        for (let i = 0; i < this.items.length; i++)
        {
            const item = this.items[i];
            //item.SetParent(this);

            if (item.display)
            {
                this._visibleItems.push(item);

                if (glows)
                {
                    const
                        src = this,
                        pos = item.GetPosition(g.vec3_1),
                        dir = item.GetDirection(g.vec3_2),
                        scale = item.GetScale();

                    if (this.visible.glows && item.visible.glow)
                    {
                        glows.CreateItem({
                            name: item.name + "_glow",
                            position: vec3.subtract(spritePos, pos, vec3.scale(spritePos, dir, src.glowDistance)),
                            blinkRate: item.seed,
                            blinkPhase: item.seed,
                            minScale: src.glowScale * scale,
                            maxScale: src.glowScale * scale,
                            color: src.glowColor,
                            warpColor: src.warpGlowColor
                        }, opt);
                    }

                    if (this.visible.symHalos && item.visible.symHalo)
                    {
                        glows.CreateItem({
                            name: item.name + "_symHalo",
                            position: vec3.subtract(spritePos, pos, vec3.scale(spritePos, dir, src.symHaloDistance)),
                            blinkRate: item.seed,
                            blinkPhase: item.seed + 1,
                            minScale: src.symHaloScale * scale,
                            maxScale: src.symHaloScale * scale,
                            color: src.haloColor,
                            warpColor: src.warpHaloColor
                        }, opt);
                    }

                    if (this.visible.halos && item.visible.halo)
                    {
                        glows.CreateItem({
                            name: item.name + "_halo",
                            position: vec3.subtract(spritePos, pos, vec3.scale(spritePos, dir, src.haloDistance)),
                            blinkRate: item.seed,
                            blinkPhase: item.seed + 1,
                            minScale: src.haloScaleX * scale,
                            maxScale: src.haloScaleY * scale,
                            color: src.haloColor,
                            warpColor: src.warpHaloColor
                        }, opt);
                    }
                }

                item._dirty = false;
            }
        }
        this._dirty = true;
    }

    /**
     * Finds a booster item that belongs to a locator by it's name
     * @param {String} locatorName
     * @returns {?EveBoosterSetItem}
     */
    FindItemByLocatorName(locatorName)
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].locatorName && this.items[i].locatorName === locatorName)
            {
                return this.items[i];
            }
        }
        return null;
    }

    /**
     * Updates booster items that were built from locators
     * @param {Array.<EveLocator2>} locators
     */
    UpdateItemsFromLocators(locators)
    {
        const items = Array.from(this.items);

        for (let i = 0; i < locators.length; i++)
        {
            const { name, transform, atlasIndex0, atlasIndex1 } = locators[i];

            let item = this.FindItemByLocatorName(name);
            if (!item)
            {
                this.CreateItem({
                    name: name,
                    locatorName: name,
                    updateFromLocator: true,
                    atlas0: atlasIndex0,
                    atlas1: atlasIndex1,
                    transform: transform
                });
            }
            else
            {
                items.splice(items.indexOf(item), 1);

                if (item.updateFromLocator)
                {
                    mat4.copy(item.transform, transform);
                    item.atlas0 = atlasIndex0;
                    item.atlas1 = atlasIndex1;
                    item.UpdateValues();
                }
            }
        }

        for (let i = 0; i < items.length; i++)
        {
            if (items[i].locatorName !== null)
            {
                this.RemoveItem(items[i]);
                i--;
            }
        }

        this._locatorDirty = false;

        if (this._dirty)
        {
            this.Rebuild();
        }
    }

    /**
     * Rebuilds the booster set from its parent's locators
     */
    RebuildItemsFromLocators()
    {
        this._locatorDirty = true;
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
        super.UpdateViewDependentData(parentTransform, null);
        if (this.glows) this.glows.UpdateViewDependentData(parentTransform, bones, spriteScale);
    }

    /**
     * Per frame update
     * @param {Number} dt - DeltaTime
     */
    Update(dt)
    {
        if (!this.display) return;
        super.Update(dt);
        if (this.glows) this.glows.Update(dt);
    }

    /**
     * Unloads the booster's buffers
     * @param {Object} [opt]
     */
    Unload(opt)
    {
        if (this._positions)
        {
            device.gl.deleteBuffer(this._positions);
            this._positions = null;
        }

        if (this.glows)
        {
            this.glows.Unload(opt);
        }

        super.Unload(opt);
    }

    /**
     * Rebuilds the boosters
     * @param {object} [opt]
     */
    Rebuild(opt)
    {
        this.RebuildItems(opt);
        const itemCount = this._visibleItems.length;
        this._dirty = false;
        if (!itemCount)
        {
            super.Rebuild(opt);
            return;
        }

        const
            d = device,
            box = EveBoosterSet._box,
            data = new Float32Array(itemCount * box.length * 6 * 28),
            order = [ 0, 3, 1, 3, 2, 1 ];

        let index = 0;
        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            for (let b = 0; b < box.length; ++b)
            {
                for (let j = 0; j < order.length; ++j)
                {
                    data[index++] = box[b][order[j]][0];
                    data[index++] = box[b][order[j]][1];
                    data[index++] = box[b][order[j]][2];
                    data[index++] = 0;
                    data[index++] = 0;
                    data.set(item.transform, index);
                    index += 16;
                    data[index++] = 0;
                    data[index++] = 1;
                    data[index++] = 1;
                    data[index++] = 1;
                    data[index++] = item.wavePhase;
                    data[index++] = item.atlas0;
                    data[index++] = item.atlas1;
                }
            }
        }

        this._positions = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._positions);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, data, d.gl.STATIC_DRAW);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, null);
        this._positions.count = itemCount * 12 * 3;

        if (this.glows) this.glows.Rebuild(opt);
        super.Rebuild(opt);
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || mode !== device.RM_ADDITIVE || !this._positions || !this._visibleItems.length)
        {
            return false;
        }

        const c = accumulator.length;

        if (this.effect)
        {
            const batch = new EveBoosterBatch();
            mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._parentTransform);
            this._perObjectData.vs.Set("Shipdata", perObjectData.vs.Get("Shipdata"));
            this._perObjectData.ps = perObjectData.ps;
            batch.perObjectData = this._perObjectData;
            batch.boosters = this;
            batch.renderMode = device.RM_ADDITIVE;
            batch.effect = this.effect;
            accumulator.Commit(batch);
        }

        if (this.glows)
        {
            this.glows.GetBoosterGlowBatches(
                mode,
                accumulator,
                perObjectData,
                this._parentTransform,
                perObjectData.vs.Get("Shipdata")[0],
                0
            );
        }

        return accumulator.length !== c;
    }

    /**
     * Renders the accumulated batches
     * @param {String} technique - technique name
     * @returns {Boolean}
     */
    Render(technique)
    {
        if (!this.effect || !this.effect.IsGood() || !this._positions) return false;

        const
            d = device,
            gl = d.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positions);
        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(d, this.effect.GetPassInput(technique, pass), 112)) return false;
            d.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLES, 0, this._positions.count);
        }
        return true;
    }

    /**
     * Creates an eve booster from a plain object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {EveBoosterSet}
     */
    static from(values, options)
    {
        const item = new EveBoosterSet();
        if (values)
        {
            assignIfExists(item, values, [
                "alwaysOn", "glowColor", "glowScale", "haloColor", "haloScaleX", "haloScaleY",
                "maxVel", "symHaloScale", "trailColor", "trailSize", "warpGlowColor",
                "name", "display", "glowDistance", "haloDistance", "symHaloDistance", "warpHaloColor"
            ]);

            // Allow for ccp spelling mistakes
            if (values.warpHalpColor !== undefined)
            {
                item.warpHaloColor = values.warpHalpColor;
            }

            if (values.visible)
            {
                assignIfExists(item.visible, values.visible, [ "glows", "symHalos", "halos", "trails" ]);
            }

            if (values.effect)
            {
                item.effect = Tw2Effect.from(values.effect);
            }

            if (values.glows)
            {
                item.glows = EveSpriteSet.from(values.glows);
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
     * The booster set's item constructor
     * @type {EveBoosterSetItem}
     */
    static Item = EveBoosterSetItem;

    /**
     * Per object data
     * @type {*}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "Shipdata", 4 ]
        ]
    };

    /**
     * Vertex declarations
     * @type {*}
     */
    static vertexDeclarations = [
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 7, elements: 2 }
    ];

    /**
     * Internal helper
     * @type {Array}
     */
    static _box = [
        [
            [ -1.0, -1.0, 0.0 ],
            [ 1.0, -1.0, 0.0 ],
            [ 1.0, 1.0, 0.0 ],
            [ -1.0, 1.0, 0.0 ]
        ],
        [
            [ -1.0, -1.0, -1.0 ],
            [ -1.0, 1.0, -1.0 ],
            [ 1.0, 1.0, -1.0 ],
            [ 1.0, -1.0, -1.0 ]
        ],
        [
            [ -1.0, -1.0, 0.0 ],
            [ -1.0, 1.0, 0.0 ],
            [ -1.0, 1.0, -1.0 ],
            [ -1.0, -1.0, -1.0 ]
        ],
        [
            [ 1.0, -1.0, 0.0 ],
            [ 1.0, -1.0, -1.0 ],
            [ 1.0, 1.0, -1.0 ],
            [ 1.0, 1.0, 0.0 ]
        ],
        [
            [ -1.0, -1.0, 0.0 ],
            [ -1.0, -1.0, -1.0 ],
            [ 1.0, -1.0, -1.0 ],
            [ 1.0, -1.0, 0.0 ]
        ],
        [
            [ -1.0, 1.0, 0.0 ],
            [ 1.0, 1.0, 0.0 ],
            [ 1.0, 1.0, -1.0 ],
            [ -1.0, 1.0, -1.0 ]
        ]
    ];

}

