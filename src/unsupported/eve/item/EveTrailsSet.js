import { meta, assignIfExists } from "utils";
import { device, tw2 } from "global";
import { vec4 } from "math";
import { Tw2Effect, Tw2VertexDeclaration, Tw2RenderBatch } from "core";
import { RM_ADDITIVE } from "constant";


/**
 * Volumetric trail render batch
 *
 * @property {EveTrailsSet} trailsSet
 */
export class EveTrailsSetBatch extends Tw2RenderBatch
{

    trailsSet = null;

    /**
     * Commits the batch
     * @param {String} [technique] - technique name
     */
    Commit(technique)
    {
        return this.trailsSet.Render(technique);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return !!(this.trailsSet && this.trailsSet.effect && this.trailsSet.effect.HasTechnique(technique));
    }

}


/**
 * The booster trails a hull emits.
 *
 * The set itself holds almost nothing: one placement per trail, and a mesh
 * drawn once per placement. The ribbon is not built here at all - it is
 * generated in `volumetrictrails` from the five spline control points the
 * owning booster set writes into the per object constants, which is why
 * `GetBatches` takes the booster's per object data rather than making its own.
 *
 * Ported from `EveTrailsSet.h` / `EveTrailsSet.cpp`.
 */
@meta.type("EveTrailsSet")
@meta.define({
    wgl: "EveTrailSet",
    ccp: true
})
export class EveTrailsSet extends meta.Model
{

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.path
    geometryResPath = EveTrailsSet.defaultGeometryResPath;

    @meta.boolean
    display = true;

    @meta.float
    fadeSpeed = 1;

    /**
     * One entry per trail: its local transform and its size
     * @type {Array<Object>}
     */
    _trailData = [];

    _geometryRes = null;
    _instanceBuffer = null;
    _instanceCount = 0;
    _dirty = true;

    /**
     * The instance stream declaration, appended to the mesh's own
     * @type {Tw2VertexDeclaration}
     */
    _instanceDecl = Tw2VertexDeclaration.from(EveTrailsSet.instanceDeclarations);

    /**
     * Initializes the trail set
     */
    Initialize()
    {
        this._instanceDecl.stride = INSTANCE_STRIDE;

        if (this.geometryResPath)
        {
            this._geometryRes = tw2.GetResource(this.geometryResPath);
        }

        if (!this.effect)
        {
            this.effect = Tw2Effect.from(EveTrailsSet.defaultTrailEffect);
        }
    }

    /**
     * Checks if the trail set is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(this.effect && this.effect.IsGood() && this._geometryRes && this._geometryRes.IsGood());
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        if (this._geometryRes && !out.includes(this._geometryRes)) out.push(this._geometryRes);
        return out;
    }

    /**
     * Drops every trail placement
     */
    Clear()
    {
        this._trailData.splice(0);
        this._dirty = true;
    }

    /**
     * Appends a trail placement with its size
     *
     * Only the transform's translation reaches the GPU: the ribbon's direction
     * comes from the spline, not from the placement's orientation.
     * @param {mat4} localMatrix
     * @param {Number} size
     */
    Add(localMatrix, size)
    {
        this._trailData.push({
            position: vec4.fromValues(localMatrix[12], localMatrix[13], localMatrix[14], size || 0),
            size: size || 0
        });
        this._dirty = true;
    }

    /**
     * Per frame update
     *
     * The set holds no time varying state: trail motion lives on the booster
     * renderable's spline.
     */
    Update()
    {
        if (this._dirty) this.Rebuild();
    }

    /**
     * Rebuilds the per instance stream, one entry per trail
     */
    Rebuild()
    {
        this._dirty = false;

        const gl = device.gl;
        this._instanceCount = this._trailData.length;

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
            data.set(this._trailData[i].position, i * INSTANCE_FLOATS);
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
     * @param {Tw2PerObjectData} perObjectData - the owning booster set's
     * @returns {Boolean} true if a batch was accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (mode !== RM_ADDITIVE || !this.display || !this.IsGood()) return false;
        if (this._dirty) this.Rebuild();
        if (!this._instanceCount || !perObjectData) return false;

        const batch = new EveTrailsSetBatch();
        batch.renderMode = RM_ADDITIVE;
        batch.perObjectData = perObjectData;
        batch.trailsSet = this;
        batch.effect = this.effect;
        accumulator.Commit(batch);

        return true;
    }

    /**
     * Renders the accumulated batch
     * @param {String} technique - technique name
     * @returns {Boolean}
     */
    Render(technique)
    {
        if (!this.IsGood() || !this._instanceCount) return false;

        const
            d = device,
            gl = d.gl,
            mesh = this._geometryRes.meshes[0];

        if (!mesh) return false;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);

            const passInput = this.effect.GetPassInput(technique, pass);
            if (!passInput.elements.length) continue;

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
            mesh.declaration.SetPartialDeclaration(d, passInput, mesh.declaration.stride);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
            const resetData = this._instanceDecl.SetPartialDeclaration(d, passInput, INSTANCE_STRIDE, 0, 1);

            d.ApplyShadowState();

            for (let i = 0; i < mesh.areas.length; i++)
            {
                const area = mesh.areas[i];
                gl.drawElementsInstanced(gl.TRIANGLES, area.count, mesh.indexType, area.start, this._instanceCount);
            }

            this._instanceDecl.ResetInstanceDivisors(d, resetData);
        }

        return true;
    }

    /**
     * Creates a trail set from a plain object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {EveTrailsSet}
     */
    static from(values, options)
    {
        const item = new EveTrailsSet();

        if (values)
        {
            assignIfExists(item, values, [ "name", "display", "fadeSpeed", "geometryResPath" ]);
            if (values.effect) item.effect = Tw2Effect.from(values.effect);
        }

        if (!options || !options.skipUpdate)
        {
            item.Initialize();
        }

        return item;
    }

    /**
     * The instance stream Carbon appends to the trail mesh's own declaration:
     * one float4 of (position.xyz, size) per trail, at offset zero
     * @type {Array}
     */
    static instanceDeclarations = [
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 }
    ];

    /**
     * Default trail effect
     * @type {String}
     */
    static defaultTrailEffect = "res:/graphics/effect/managed/space/booster/volumetrictrails.fx";

    /**
     * Default geometry res path
     * @type {String}
     */
    static defaultGeometryResPath = "res:/dx9/model/ship/booster/volumetrictrail.gr2";

}


const INSTANCE_FLOATS = 4;
const INSTANCE_STRIDE = INSTANCE_FLOATS * 4;
