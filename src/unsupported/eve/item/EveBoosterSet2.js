import { meta, assignIfExists } from "utils";
import { device } from "global";
import { vec3, vec4, mat4, quat, box3, sph3 } from "math";
import { Tw2VertexDeclaration, Tw2PerObjectData, Tw2RenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem, EveSpriteSet } from "eve";
import { Tw2Effect } from "core/mesh";
import { EveTrailsSet } from "./EveTrailsSet";
import { EveBoosterSet2Renderable } from "./EveBoosterSet2Renderable";


/**
 * Booster set 2 render batch
 *
 * @property {EveBoosterSet2} boosterSet
 * @property {EveBoosterSet2Renderable} renderable
 */
export class EveBoosterSet2Batch extends Tw2RenderBatch
{

    boosterSet = null;
    renderable = null;

    /**
     * Commits the batch
     * @param {String} [technique] - technique name
     */
    Commit(technique)
    {
        return this.boosterSet.Render(technique, this.renderable);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        const effect = this.boosterSet ? this.boosterSet.GetEffect(this.renderable) : null;
        return !!(effect && effect.HasTechnique(technique));
    }

}


/**
 * One authored booster placement: its local transform, functionality inputs,
 * atlas slots, light scale and whether it emits a trail
 */
@meta.type("EveBoosterSet2Item")
@meta.define({
    wgl: "EveBoosterSet2Item",
    ccp: true
})
export class EveBoosterSet2Item extends EveObjectSetItem
{

    @meta.string
    name = "";

    @meta.string
    locatorName = null;

    @meta.boolean
    updateFromLocator = false;

    @meta.matrix4
    transform = mat4.create();

    /**
     * The four booster functionality inputs the shader reads from TEXCOORD5.
     * Carbon's default is (0, 1, 1, 1), which the first generation set wrote
     * as a literal into every expanded vertex.
     */
    @meta.vector4
    functionality = vec4.fromValues(0, 1, 1, 1);

    @meta.boolean
    hasTrail = true;

    @meta.uint
    atlasIndex0 = 0;

    @meta.uint
    atlasIndex1 = 0;

    @meta.float
    lightScale = 1;

    @meta.float
    wavePhase = Math.random();

    /**
     * Gets the item's local transform
     * @param {mat4} out
     * @returns {mat4} out
     */
    GetTransform(out)
    {
        return mat4.copy(out, this.transform);
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

}


/**
 * Second generation booster set.
 *
 * Where the first generation expands every booster into its own triangle soup
 * on the CPU, this one uploads a shared 24 vertex box once and draws it
 * instanced, one instance per booster, exactly as Carbon does. That is what
 * makes the trail spline affordable: the five control points live in the per
 * object constants, so the trail ribbon is generated in the shader rather than
 * rebuilt on the CPU each frame.
 *
 * Ported from `EveBoosterSet2.h` / `EveBoosterSet2.cpp`.
 */
@meta.type("EveBoosterSet2")
@meta.define({
    wgl: "EveBoosterSet2",
    ccp: true
})
export class EveBoosterSet2 extends EveObjectSet
{

    @meta.boolean
    alwaysOn = false;

    @meta.float
    alwaysOnIntensity = 1;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.struct("Tw2Effect")
    effectFar = null;

    @meta.color
    glowColor = vec4.create();

    @meta.float
    glowScale = 1;

    @meta.struct("EveSpriteSet")
    glows = null;

    @meta.color
    haloColor = vec4.create();

    @meta.float
    haloScaleX = 1;

    @meta.float
    haloScaleY = 1;

    @meta.color
    lightColor = vec4.create();

    @meta.float
    lightFlickerAmplitude = 0;

    @meta.float
    lightFlickerFrequency = 0;

    @meta.float
    lightOffset = 0;

    @meta.float
    lightRadius = 0;

    @meta.color
    lightWarpColor = vec4.create();

    @meta.float
    lightWarpRadius = 0;

    @meta.float
    maxVel = 250;

    @meta.float
    symHaloScale = 1;

    @meta.struct("EveTrailsSet")
    trails = null;

    @meta.color
    warpGlowColor = vec4.create();

    @meta.color
    warpHaloColor = vec4.create();

    @meta.float
    warpIntensity = 0;

    @meta.float
    trailsSmoothing = 10;

    @meta.float
    staticTrailLength = 0;

    /**
     * Every ship hull in the shipped data trails, so a booster trails unless
     * its locator says otherwise. Clear this to honour the authored flag.
     */
    @meta.boolean
    trailAllBoosters = true;

    @meta.boolean
    physicsUpdate = true;

    /** ccpwgl has no destiny, so speed is derived from the transform delta. */
    @meta.boolean
    destinyUpdate = false;

    /**
     * The five static trail control offsets, used when the set is not physics
     * driven. Redistributed evenly backwards along -Z across staticTrailLength.
     * @type {Array<vec3>}
     */
    trailsStaticOffsets = Array.from({ length: CONTROL_POINT_COUNT }, () => vec3.create());

    /**
     * The derived runtime boosters, one per visible item
     * @type {Array<Object>}
     */
    _singleBoosters = [];

    /**
     * One renderable per ship drawing this set
     * @type {Array<EveBoosterSet2Renderable>}
     */
    _renderables = [];

    _maxSize = 0;
    _boosterBoundingSphereCenter = vec3.create();
    _boosterBoundingSphereRadius = 0;
    _glowsVisible = true;
    _locatorDirty = true;

    _perObjectData = Tw2PerObjectData.from(EveBoosterSet2Renderable.perObjectData);

    _vertexBuffer = null;
    _indexBuffer = null;
    _indexCount = 0;
    _instanceBuffer = null;
    _instanceCount = 0;

    _vertexDecl = Tw2VertexDeclaration.from(EveBoosterSet2.vertexDeclarations);
    _instanceDecl = Tw2VertexDeclaration.from(EveBoosterSet2.instanceDeclarations);

    /**
     * Alias for the authored max booster size, read by the renderable
     * @returns {Number}
     */
    get maxSize()
    {
        return this._maxSize;
    }

    /**
     * @returns {vec3}
     */
    get boosterBoundingSphereCenter()
    {
        return this._boosterBoundingSphereCenter;
    }

    /**
     * @returns {Number}
     */
    get boosterBoundingSphereRadius()
    {
        return this._boosterBoundingSphereRadius;
    }

    /**
     * Initializes the set
     */
    Initialize()
    {
        this._vertexDecl.stride = VERTEX_STRIDE;
        this._instanceDecl.stride = INSTANCE_STRIDE;
        this._perObjectData.carbonPerObjectPacker = EveBoosterSet2.carbonPerObjectPacker;
        this.UpdateStaticTrailOffsets();
        super.Initialize();
        if (!this._renderables.length) this.SetCount(1);
    }

    /**
     * Gets the set's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        if (this.effectFar) this.effectFar.GetResources(out);
        if (this.glows) this.glows.GetResources(out);
        if (this.trails) this.trails.GetResources(out);
        return out;
    }

    /**
     * Checks if the set is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(this.effect && this.effect.IsGood());
    }

    /**
     * Resizes the renderable instance list, one instance per ship drawing this
     * booster set, keeping at least one
     * @param {Number} count
     * @returns {Number} the resulting count
     */
    SetCount(count)
    {
        const target = Math.max(1, Math.trunc(Number(count)) || 1);

        if (this._renderables.length > target) this._renderables.length = target;
        while (this._renderables.length < target) this._renderables.push(new EveBoosterSet2Renderable());
        for (let i = 0; i < this._renderables.length; i++) this._renderables[i].SetBoosterSet(this);

        return this._renderables.length;
    }

    /**
     * Gets a renderable instance
     * @param {Number} [index=0]
     * @returns {EveBoosterSet2Renderable}
     */
    GetRenderable(index = 0)
    {
        if (!this._renderables.length) this.SetCount(1);
        return this._renderables[index] || this._renderables[0];
    }

    /**
     * Picks the effect a renderable draws with. Carbon falls back to the near
     * effect when the set has no far one, rather than skipping the draw.
     * @param {EveBoosterSet2Renderable} [renderable]
     * @returns {Tw2Effect}
     */
    GetEffect(renderable)
    {
        if (!renderable || renderable.boosterHighLod || !this.effectFar) return this.effect;
        return this.effectFar;
    }

    /**
     * Updates booster items that were built from locators
     * @param {Array<EveLocator2>} locators
     */
    UpdateItemsFromLocators(locators)
    {
        const items = Array.from(this.items);

        for (let i = 0; i < locators.length; i++)
        {
            const { name, transform, atlasIndex0, atlasIndex1, lightScale } = locators[i];

            // ccpwgl's SOF reader does not populate either of these - the hull
            // booster item's `functionality` is still marked not implemented and
            // reads as four zeroes, which the shader takes as a dead booster, and
            // `hasTrail` reads false on every ship hull even though they all
            // trail. So an unset value falls back to Carbon's default rather
            // than being believed.
            const
                raw = locators[i].functionality,
                functionality = raw && (raw[1] || raw[2] || raw[3]) ? raw : DEFAULT_FUNCTIONALITY,
                hasTrail = locators[i].hasTrail === undefined ? true : !!locators[i].hasTrail || this.trailAllBoosters;

            let item = this.FindItemByLocatorName(name);
            if (!item)
            {
                this.CreateItem({
                    name,
                    locatorName: name,
                    updateFromLocator: true,
                    atlasIndex0,
                    atlasIndex1,
                    functionality,
                    hasTrail,
                    lightScale,
                    transform
                });
            }
            else
            {
                items.splice(items.indexOf(item), 1);

                if (item.updateFromLocator)
                {
                    mat4.copy(item.transform, transform);
                    vec4.copy(item.functionality, functionality);
                    item.atlasIndex0 = atlasIndex0;
                    item.atlasIndex1 = atlasIndex1;
                    item.hasTrail = hasTrail;
                    item.lightScale = lightScale;
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
        if (this._dirty) this.Rebuild();
    }

    /**
     * Marks the set for a rebuild from its parent's locators
     */
    RebuildItemsFromLocators()
    {
        this._locatorDirty = true;
    }

    /**
     * Finds an item by its locator name
     * @param {String} locatorName
     * @returns {?EveBoosterSet2Item}
     */
    FindItemByLocatorName(locatorName)
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].locatorName === locatorName) return this.items[i];
        }
        return null;
    }

    /**
     * Redistributes the five static trail control offsets evenly backwards
     * along -Z across staticTrailLength
     */
    UpdateStaticTrailOffsets()
    {
        const step = this.staticTrailLength / (CONTROL_POINT_COUNT - 1);
        for (let i = 0; i < CONTROL_POINT_COUNT; i++)
        {
            vec3.set(this.trailsStaticOffsets[i], 0, 0, -step * i);
        }
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Array<Tw2Bone>} [bones]
     * @param {Number} [spriteScale]
     */
    UpdateViewDependentData(parentTransform, bones, spriteScale)
    {
        if (!this.display) return;
        super.UpdateViewDependentData(parentTransform, null);
        if (this.glows) this.glows.UpdateViewDependentData(parentTransform, bones, spriteScale);
    }

    /**
     * Per frame update
     *
     * Carbon drives this from `EveShip2::UpdateBoosters`, which knows the
     * ship's destiny speed, acceleration and rotation. ccpwgl has no destiny,
     * so `destinyUpdate` defaults to false and the renderable derives speed
     * from the world transform delta - Carbon's own non destiny path. The
     * rotation the trail direction needs is read off the same transform.
     *
     * A caller that does know the ship's state can pass it as `shipState` and
     * set `destinyUpdate`.
     * @param {Number} dt - delta time
     * @param {mat4} [worldTransform] - the owner's world transform
     * @param {Object} [shipState]
     * @param {Number} [shipState.gain] - the owner's booster gain, taken as an
     * intensity floor so a parked ship still burns when asked to
     * @param {Number} [shipState.speed]
     * @param {vec3} [shipState.acceleration]
     * @param {quat} [shipState.rotation]
     */
    Update(dt, worldTransform, shipState)
    {
        if (!this.display) return;

        super.Update(dt);

        if (!this._renderables.length) this.SetCount(1);

        const transform = worldTransform || this._parentTransform;
        mat4.getRotation(quat_0, transform);

        const renderable = this._renderables[0];
        renderable.intensityFloor = shipState && shipState.gain !== undefined ? shipState.gain : 0;
        renderable.Update(
            dt,
            transform,
            shipState ? shipState.speed : 0,
            shipState ? shipState.acceleration : null,
            shipState && shipState.rotation ? shipState.rotation : quat_0
        );

        if (this.trails)
        {
            for (let i = 0; i < this._renderables.length; i++)
            {
                this._renderables[i].UpdateTrails(dt);
            }
            this.trails.Update(dt);
        }

        if (this.glows) this.glows.Update(dt);
    }

    /**
     * Updates lod
     * @param {Tw2Frustum} frustum
     * @param {Number} [parentLod] - the owner's lod level, which gates the
     * boosters and trails; see EveBoosterSet2Renderable.UpdateLod for why the
     * pixel-size thresholds are not used for that
     */
    UpdateLod(frustum, parentLod)
    {
        for (let i = 0; i < this._renderables.length; i++)
        {
            this._renderables[i].UpdateLod(frustum, parentLod);
        }

        this._glowsVisible = false;
        if (!this.display) return;

        // Carbon breaks on the first renderable whose glow sprite set is on
        // screen, so this is a whole set flag and not a per booster one.
        for (let i = 0; i < this._renderables.length; i++)
        {
            if (this._renderables[i].boostersVisible)
            {
                this._glowsVisible = true;
                break;
            }
        }
    }

    /**
     * Rebuilds the set
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        this.RebuildItems(opt);
        this._dirty = false;

        this.RebuildRuntimeItems();
        this.RebuildGeometry();
        this.RebuildInstanceData();

        if (this.glows) this.glows.Rebuild(opt);
        if (this.trails) this.trails.Rebuild(opt);

        super.Rebuild(opt);
    }

    /**
     * Derives the runtime boosters, flares and trails from the visible items
     */
    RebuildRuntimeItems()
    {
        this._singleBoosters.splice(0);
        if (this.glows) this.glows.ClearItems();
        if (this.trails) this.trails.Clear();

        vec3.set(this._boosterBoundingSphereCenter, 0, 0, 0);
        this._boosterBoundingSphereRadius = 0;
        this._maxSize = 0;

        for (let i = 0; i < this._visibleItems.length; i++)
        {
            this.AddRuntimeItem(this._visibleItems[i]);
        }
    }

    /**
     * Derives one runtime booster from an authored item: scale from the larger
     * of the transform's X and Y basis lengths, a light position pushed back
     * along -Z by lightOffset, and a random light flicker phase. Then creates
     * its flares and its trail, offset back half a unit along the booster axis,
     * and grows the set bounding sphere and max size.
     * @param {EveBoosterSet2Item} item
     */
    AddRuntimeItem(item)
    {
        const
            transform = mat4.clone(item.transform),
            scale = Math.max(
                Math.hypot(transform[0], transform[1], transform[2]),
                Math.hypot(transform[4], transform[5], transform[6])
            );

        vec3.set(vec3_0, 0, 0, -this.lightOffset);

        const booster = {
            transform,
            functionality: vec4.clone(item.functionality),
            lightPosition: vec3.transformMat4(vec3.create(), vec3_0, transform),
            lightRadius: scale * item.lightScale,
            lightPhase: 128 * Math.random(),
            atlasIndex0: item.atlasIndex0,
            atlasIndex1: item.atlasIndex1,
            wavePhase: item.wavePhase,
            hasTrail: item.hasTrail
        };

        this._singleBoosters.push(booster);

        if (this.glows) this.CreateFlares(booster, scale);

        if (this.trails && item.hasTrail)
        {
            // Carbon pushes the trail origin half a unit back along the
            // booster's own Z axis so the ribbon starts behind the flame.
            const trailTransform = mat4.clone(transform);
            trailTransform[12] -= trailTransform[8] * 0.5;
            trailTransform[13] -= trailTransform[9] * 0.5;
            trailTransform[14] -= trailTransform[10] * 0.5;
            this.trails.Add(trailTransform, scale);
        }

        this.GrowBoundingSphere(transform[12], transform[13], transform[14]);
        this._maxSize = Math.max(this._maxSize, scale);
    }

    /**
     * Adds the three flare sprites Carbon authors per booster: the glow, the
     * symmetric halo and the separately scaled X/Y halo, placed at increasing
     * distances back along the booster axis and sharing one random blink seed.
     * The axis is shortened for boosters below scale 3.
     * @param {Object} booster
     * @param {Number} scale
     */
    CreateFlares(booster, scale)
    {
        const
            transform = booster.transform,
            position = vec3.set(vec3_0, transform[12], transform[13], transform[14]),
            direction = vec3.set(vec3_1, transform[8], transform[9], transform[10]);

        if (vec3.squaredLength(direction)) vec3.normalize(direction, direction);
        if (scale < 3) vec3.scale(direction, direction, scale / 3);

        const seed = Math.random() * 0.7;

        this.AddFlare(position, direction, 2.5, seed, seed, scale * this.glowScale, scale * this.glowScale, this.glowColor, this.warpGlowColor);
        this.AddFlare(position, direction, 3, seed, 1 + seed, scale * this.symHaloScale, scale * this.symHaloScale, this.haloColor, this.warpHaloColor);
        this.AddFlare(position, direction, 3.01, seed, 1 + seed, scale * this.haloScaleX, scale * this.haloScaleY, this.haloColor, this.warpHaloColor);
    }

    /**
     * Adds one flare sprite to the glow set, offset back along the booster
     * direction by distance and carrying its normal and warp colours
     * @param {vec3} position
     * @param {vec3} direction
     * @param {Number} distance
     * @param {Number} blinkRate
     * @param {Number} blinkPhase
     * @param {Number} minScale
     * @param {Number} maxScale
     * @param {vec4} color
     * @param {vec4} warpColor
     */
    AddFlare(position, direction, distance, blinkRate, blinkPhase, minScale, maxScale, color, warpColor)
    {
        this.glows.CreateItem({
            position: vec3.scaleAndAdd(vec3.create(), position, direction, -distance),
            blinkRate,
            blinkPhase,
            minScale,
            maxScale,
            falloff: 0,
            color: vec4.clone(color),
            warpColor: vec4.clone(warpColor)
        });
    }

    /**
     * Grows the set bounding sphere just far enough to include one booster
     * position, leaving it unchanged when the position already falls inside
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    GrowBoundingSphere(x, y, z)
    {
        vec3.set(vec3_2, x, y, z);

        const
            delta = vec3.subtract(vec3_2, vec3_2, this._boosterBoundingSphereCenter),
            distance = vec3.length(delta),
            radius = this._boosterBoundingSphereRadius;

        if (!distance || distance * distance <= radius * radius + 1e-4) return;

        vec3.scaleAndAdd(
            this._boosterBoundingSphereCenter,
            this._boosterBoundingSphereCenter,
            delta,
            0.5 * (1 - radius / distance)
        );

        this._boosterBoundingSphereRadius = 0.5 * (radius + distance);
    }

    /**
     * Uploads the shared booster shape once: a 24 vertex box as six quads, or
     * a 16 vertex star as four, plus the quad list index buffer that turns
     * either into triangles
     */
    RebuildGeometry()
    {
        if (this._vertexBuffer) return;

        const
            gl = device.gl,
            shape = device.shaderModel === "lo" ? STAR_VERTICES : BOX_VERTICES,
            quadCount = shape.length / (4 * VERTEX_FLOATS);

        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, shape, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Carbon's shared quad list index buffer: (0,2,1) (0,3,2) per quad
        const indices = new Uint16Array(quadCount * 6);
        for (let q = 0; q < quadCount; q++)
        {
            const o = q * 6, v = q * 4;
            indices[o] = v;
            indices[o + 1] = v + 2;
            indices[o + 2] = v + 1;
            indices[o + 3] = v;
            indices[o + 4] = v + 3;
            indices[o + 5] = v + 2;
        }

        this._indexCount = indices.length;
        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    /**
     * Rebuilds the per instance stream, one entry per runtime booster
     */
    RebuildInstanceData()
    {
        const gl = device.gl;

        this._instanceCount = this._singleBoosters.length;
        if (!this._instanceCount)
        {
            if (this._instanceBuffer)
            {
                gl.deleteBuffer(this._instanceBuffer);
                this._instanceBuffer = null;
            }
            return;
        }

        const data = new Float32Array(this._instanceCount * INSTANCE_FLOATS);

        for (let i = 0; i < this._instanceCount; i++)
        {
            const booster = this._singleBoosters[i];
            let index = i * INSTANCE_FLOATS;

            data.set(booster.transform, index);
            index += 16;
            data.set(booster.functionality, index);
            index += 4;
            data[index++] = booster.wavePhase;
            data[index++] = booster.atlasIndex0;
            data[index++] = booster.atlasIndex1;
        }

        if (!this._instanceBuffer) this._instanceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
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
        if (!this.display || mode !== device.RM_ADDITIVE || !this.IsGood()) return false;
        if (!this._instanceCount || !this._vertexBuffer) return false;

        const
            c = accumulator.length,
            renderable = this.GetRenderable(0);

        if (renderable.boostersVisible)
        {
            renderable.FillPerObjectData(this._perObjectData);

            const batch = new EveBoosterSet2Batch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.perObjectData = this._perObjectData;
            batch.boosterSet = this;
            batch.renderable = renderable;
            batch.effect = this.GetEffect(renderable);
            accumulator.Commit(batch);
        }

        // The trail shares the booster's per object data: the whole ribbon is
        // generated in the shader from the five spline slots it carries.
        if (renderable.trailsVisible && this.trails &&
            renderable.trailsTotalLength > 0 && renderable.trailIntensity > 0)
        {
            this.trails.GetBatches(mode, accumulator, this._perObjectData);
        }

        if (this.glows && this._glowsVisible)
        {
            this.glows.GetBoosterGlowBatches(
                mode,
                accumulator,
                perObjectData,
                this._parentTransform,
                renderable.overallIntensity,
                0
            );
        }

        return accumulator.length !== c;
    }

    /**
     * Renders the accumulated batch
     * @param {String} technique - technique name
     * @param {EveBoosterSet2Renderable} renderable
     * @returns {Boolean}
     */
    Render(technique, renderable)
    {
        const effect = this.GetEffect(renderable);
        if (!effect || !effect.IsGood() || !this._instanceCount) return false;

        const
            d = device,
            gl = d.gl;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);

            const passInput = effect.GetPassInput(technique, pass);
            if (!passInput.elements.length) continue;

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            this._vertexDecl.SetPartialDeclaration(d, passInput, VERTEX_STRIDE);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
            const resetData = this._instanceDecl.SetPartialDeclaration(d, passInput, INSTANCE_STRIDE, 0, 1);

            d.ApplyShadowState();
            gl.drawElementsInstanced(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0, this._instanceCount);

            this._instanceDecl.ResetInstanceDivisors(d, resetData);
        }

        return true;
    }

    /**
     * Gets the set's world bounding sphere
     * @param {sph3} out
     * @returns {sph3} out
     */
    GetBoundingSphere(out)
    {
        sph3.empty(out);
        for (let i = 0; i < this._renderables.length; i++)
        {
            this._renderables[i].GetBoundingSphere(sph3_0);
            sph3.union(out, out, sph3_0);
        }
        return out;
    }

    /**
     * Gets the booster point lights, one per booster per renderable.
     *
     * There is no display gate, matching Carbon: the effective gates are both
     * light radii being zero and the renderable's intensity being zero. The
     * shared 128 entry noise table drives a flicker of 1 +/- amplitude around
     * the interpolated noise.
     * @param {Object} lightManager
     * @param {Number} [time=0]
     */
    GetLights(lightManager, time = 0)
    {
        if (this.lightRadius <= 0 && this.lightWarpRadius <= 0) return;

        if (!LIGHT_NOISE_INITIALIZED)
        {
            LIGHT_NOISE_INITIALIZED = true;
            for (let i = 0; i < LIGHT_NOISE_SIZE; i++) LIGHT_NOISE[i] = Math.random();
        }

        const warpIntensity = Math.min(Math.max(this.warpIntensity, 0), 1);

        for (let r = 0; r < this._renderables.length; r++)
        {
            const renderable = this._renderables[r];
            if (renderable.overallIntensity <= 0) continue;

            const transform = renderable.GetParentTransformReference();

            let radiusFactor = this.lightRadius * (1 - warpIntensity) + this.lightWarpRadius * warpIntensity;
            radiusFactor *= renderable.overallIntensity;

            for (let channel = 0; channel < 4; channel++)
            {
                vec4_0[channel] = this.lightColor[channel] * (1 - warpIntensity) + this.lightWarpColor[channel] * warpIntensity;
            }

            for (let i = 0; i < this._singleBoosters.length; i++)
            {
                const
                    booster = this._singleBoosters[i],
                    phase = (booster.lightPhase + time) * this.lightFlickerFrequency,
                    p0 = LIGHT_NOISE[Math.trunc(phase) % LIGHT_NOISE_SIZE],
                    p1 = LIGHT_NOISE[(Math.trunc(phase) + 1) % LIGHT_NOISE_SIZE],
                    t = phase - Math.floor(phase),
                    flicker = 1 + this.lightFlickerAmplitude * 2 * (p0 * (1 - t) + p1 * t) - this.lightFlickerAmplitude;

                vec3.transformMat4(vec3_0, booster.lightPosition, transform);
                vec4.set(vec4_1, vec4_0[0] * flicker, vec4_0[1] * flicker, vec4_0[2] * flicker, vec4_0[3] * flicker);

                lightManager.AddPointLight(vec3_0, booster.lightRadius * radiusFactor, vec4_1);
            }
        }
    }

    /**
     * Sets the whole flare description in one call
     */
    SetData(glowScale, glowColor, warpGlowColor, symHaloScale, haloScaleX, haloScaleY, haloColor, warpHaloColor, alwaysOn)
    {
        this.glowScale = glowScale;
        vec4.copy(this.glowColor, glowColor);
        vec4.copy(this.warpGlowColor, warpGlowColor);
        this.symHaloScale = symHaloScale;
        this.haloScaleX = haloScaleX;
        this.haloScaleY = haloScaleY;
        vec4.copy(this.haloColor, haloColor);
        vec4.copy(this.warpHaloColor, warpHaloColor);
        this.alwaysOn = !!alwaysOn;
        this._dirty = true;
    }

    /**
     * Sets the whole booster point light description in one call
     */
    SetLightData(offset, flickerAmplitude, flickerFrequency, radius, color, warpRadius, warpColor)
    {
        this.lightOffset = offset;
        this.lightFlickerAmplitude = flickerAmplitude;
        this.lightFlickerFrequency = flickerFrequency;
        this.lightRadius = radius;
        vec4.copy(this.lightColor, color);
        this.lightWarpRadius = warpRadius;
        vec4.copy(this.lightWarpColor, warpColor);
        this._dirty = true;
    }

    /**
     * Creates a booster set from a plain object
     *
     * The struct children are constructed explicitly rather than assigned,
     * because the generic struct setter only accepts an already built instance.
     * @param {*} [values]
     * @param {*} [options]
     * @returns {EveBoosterSet2}
     */
    static from(values, options)
    {
        const item = new EveBoosterSet2();

        if (values)
        {
            assignIfExists(item, values, [
                "name", "display", "alwaysOn", "alwaysOnIntensity",
                "glowColor", "glowScale", "haloColor", "haloScaleX", "haloScaleY",
                "symHaloScale", "warpGlowColor", "warpHaloColor", "warpIntensity",
                "lightColor", "lightFlickerAmplitude", "lightFlickerFrequency",
                "lightOffset", "lightRadius", "lightWarpColor", "lightWarpRadius",
                "maxVel", "trailsSmoothing", "staticTrailLength",
                "physicsUpdate", "destinyUpdate", "trailAllBoosters"
            ]);

            // Allow for the ccp spelling mistake, as the first generation does
            if (values.warpHalpColor !== undefined)
            {
                item.warpHaloColor = values.warpHalpColor;
            }

            if (values.effect) item.effect = Tw2Effect.from(values.effect);
            if (values.effectFar) item.effectFar = Tw2Effect.from(values.effectFar);
            if (values.glows) item.glows = EveSpriteSet.from(values.glows);
            if (values.trails) item.trails = EveTrailsSet.from(values.trails);

            if (values.items)
            {
                for (let i = 0; i < values.items.length; i++)
                {
                    item.CreateItem(values.items[i], { skipUpdate: true });
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
     * The item constructor used by the set's item helpers
     * @type {EveBoosterSet2Item}
     */
    static Item = EveBoosterSet2Item;

    /**
     * Carbon packer for the booster cb3/cb4 layout.
     *
     * The dx11 path does not upload `perObjectData` directly - it hands it to
     * `Tw2CarbonResourceBinder`, which by default reorganizes it through the
     * HULL layout. That corrupts a booster set, whose registers mean something
     * else entirely.
     *
     * No reorganization is needed here: `EveBoosterSet2Renderable.perObjectData`
     * is already Carbon's `EveBoosterSetPerObjectData` register for register,
     * so the packer copies straight through and lets `fitConstantBuffer` trim
     * to whatever the shader declared - five registers for the booster itself,
     * fifteen for the trails, which read the spline slots.
     * @type {Object}
     */
    static carbonPerObjectPacker = {

        OnBeforeCarbonConstants(context)
        {
            context.carbonPerObjectPacker = this;
        },

        PackPerObjectVS(out, perObjectData)
        {
            out.fill(0);
            const source = perObjectData.vs && perObjectData.vs.data;
            if (source) out.set(source.subarray(0, Math.min(source.length, out.length)));
            return out;
        },

        PackPerObjectPS(out, perObjectData)
        {
            out.fill(0);
            const source = perObjectData.ps && perObjectData.ps.data;
            if (source) out.set(source.subarray(0, Math.min(source.length, out.length)));
            return out;
        }

    };

    /**
     * Per vertex stream: the shared booster shape
     * @type {Array}
     */
    static vertexDeclarations = [
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
    ];

    /**
     * Per instance stream: transform, functionality, wave phase and atlas slots
     * @type {Array}
     */
    static instanceDeclarations = [
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 7, elements: 2 }
    ];

}


/**
 * Carbon's process global booster light noise table
 */
const LIGHT_NOISE_SIZE = 128;
const LIGHT_NOISE = new Float32Array(LIGHT_NOISE_SIZE);
let LIGHT_NOISE_INITIALIZED = false;

// Carbon EVE_MAX_CONTROL_POINT_COUNT: the trail spline is always five points.
const CONTROL_POINT_COUNT = 5;

/** Carbon's default booster functionality inputs. */
const DEFAULT_FUNCTIONALITY = vec4.fromValues(0, 1, 1, 1);

const VERTEX_FLOATS = 5;
const VERTEX_STRIDE = VERTEX_FLOATS * 4;
const INSTANCE_FLOATS = 23;
const INSTANCE_STRIDE = INSTANCE_FLOATS * 4;

/**
 * The six quads of the booster box, as position3 + texCoord2 per vertex.
 * Carbon leaves the box's texture coordinates uninitialized because
 * `boostervolumetric` never reads TEXCOORD0; they are written as zero here so
 * the buffer is deterministic.
 */
const BOX_VERTICES = new Float32Array([
    -1, -1, 0, 0, 0, 1, -1, 0, 0, 0, 1, 1, 0, 0, 0, -1, 1, 0, 0, 0,
    -1, -1, -1, 0, 0, -1, 1, -1, 0, 0, 1, 1, -1, 0, 0, 1, -1, -1, 0, 0,
    -1, -1, 0, 0, 0, -1, 1, 0, 0, 0, -1, 1, -1, 0, 0, -1, -1, -1, 0, 0,
    1, -1, 0, 0, 0, 1, -1, -1, 0, 0, 1, 1, -1, 0, 0, 1, 1, 0, 0, 0,
    -1, -1, 0, 0, 0, -1, -1, -1, 0, 0, 1, -1, -1, 0, 0, 1, -1, 0, 0, 0,
    -1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, -1, 0, 0, -1, 1, -1, 0, 0
]);

/**
 * The four quads of the low detail booster star, fanned around Z
 */
const STAR_VERTICES = (function ()
{
    const out = new Float32Array(4 * 4 * VERTEX_FLOATS);
    let index = 0;

    for (let i = 0; i < 16; i += 4)
    {
        const
            t = i * Math.PI / 4 / 4,
            x = Math.cos(t) * 0.5,
            y = Math.sin(t) * 0.5;

        out.set([ -x, -y, 0, 1, 1 ], index); index += VERTEX_FLOATS;
        out.set([ -x, -y, -1, 1, 0 ], index); index += VERTEX_FLOATS;
        out.set([ x, y, -1, 0, 0 ], index); index += VERTEX_FLOATS;
        out.set([ x, y, 0, 0, 1 ], index); index += VERTEX_FLOATS;
    }

    return out;
})();

const vec3_0 = vec3.create();
const vec3_1 = vec3.create();
const vec3_2 = vec3.create();
const vec4_0 = vec4.create();
const vec4_1 = vec4.create();
const quat_0 = quat.create();
const sph3_0 = sph3.create();
