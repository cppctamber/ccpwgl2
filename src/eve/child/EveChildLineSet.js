// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildLineSet.cpp
import { meta } from "utils";
import { EveChild } from "./EveChild";
import { mat4, sph3, vec3, vec4, quat } from "math";
import { EveCurveLineSet } from "eve/item/EveCurveLineSet";
import { device } from "global/tw2";
import { GLESPerObjectDataEveSpaceObject } from "core/data/Tr2PerObjectData";
import { Tw2InstancedMeshBatch } from "core/batch/Tw2InstancedMeshBatch";
import { Tw2VertexDeclaration } from "core/vertex/Tw2VertexDeclaration";


/**
 * Authored paths rendered as lines, animated mesh instances, or both.
 * The instance stream holds three float4 rows of each transposed local matrix;
 * the child world transform is supplied separately through per-object data.
 */
@meta.define("EveChildLineSet", true)
@meta.stage(2)
export class EveChildLineSet extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    additiveBatches = false;

    @meta.boolean
    alwaysOn = false;

    @meta.vector4
    animColor = vec4.fromValues(0, 0, 0, 1);

    @meta.vector4
    baseColor = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    brightness = 1;

    @meta.float
    currentScreenSize = 1;

    @meta.boolean
    display = true;

    @meta.list()
    lines = [];

    @meta.struct("EveCurveLineSet")
    lineSet = null;

    @meta.struct("Tw2Mesh", "Tr2Mesh")
    mesh = null;

    @meta.float
    minScreenSize = -1;

    @meta.uint
    renderType = 1;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    scrollSpeed = 0;

    @meta.vector3
    translation = vec3.create();

    @meta.matrix4
    localTransform = mat4.create();

    @meta.boolean
    isVisible = true;

    @meta.boolean
    useSRT = true;

    @meta.boolean
    staticTransform = false;

    _worldTransform = mat4.create();

    _worldTransformLast = mat4.create();

    _instanceData = new Float32Array(0);

    _instanceCount = 0;

    _instanceBuffer = null;

    _instanceDeclaration = null;

    _instanceDataDirty = true;

    _perObjectData = null;

    /** Aggregate sphere in line-set local space. */
    _boundingSphere = sph3.fromPositionRadius(sph3.create(), vec3.create(), 1);

    /** Set whenever the points or the colours need re-adding to the line set. */
    _updateLineSet = true;

    /** Until the first `Update`, the world transform is meaningless. */
    _hasUpdated = false;

    /**
     * Creates the line set if the file did not carry one, then lays out the
     * points. Carbon `EveChildLineSet::Initialize` (cpp:76-90) - it creates the
     * set the same way, because the set is owned rather than authored.
     *
     * Both readers call `Initialize()` once an object finishes deserializing.
     */
    Initialize()
    {
        if (!this.lineSet)
        {
            this.lineSet = new EveCurveLineSet();
            this.lineSet.name = this.name;
        }

        this.lineSet.additive = this.additiveBatches;
        this.lineSet.display = true;

        this.GenerateManagedPoints();
        this.InitializeLineSet();
        return true;
    }

    OnModified()
    {
        if (this.lineSet) this.lineSet.additive = this.additiveBatches;
        this._updateLineSet = true;
        return true;
    }

    /**
     * @returns {String}
     */
    GetName()
    {
        return this.name;
    }

    /**
     * @param {String} name
     */
    SetName(name)
    {
        this.name = name || "";
    }

    /**
     * @returns {Boolean}
     */
    IsAlwaysOn()
    {
        return this.alwaysOn;
    }

    /**
     * Carbon `IsUpdating` (cpp:501-504) - display AND visibility, and it gates
     * both the rebuild and the draw.
     * @returns {Boolean}
     */
    IsUpdating()
    {
        return this.display && this.isVisible;
    }

    /**
     * Asks every path to lay out its points against this child's world transform.
     * Carbon `GenerateManagedPoints` (cpp:138-146).
     */
    GenerateManagedPoints()
    {
        const geometry = this.mesh && this.mesh.geometryResource;
        const meshData = geometry && geometry.IsGood() && geometry.meshes[this.mesh.meshIndex];
        const meshSize = this.renderType !== EveChildLineSet.RenderType.LINE_RENDER && meshData ? meshData.boundsSphereRadius : 0;
        for (let i = 0; i < this.lines.length; i++)
        {
            const path = this.lines[i];
            if (!path) continue;
            path.GeneratePoints(this._worldTransform);
            path.CalculateBoundingSphere(meshSize);
        }

        this.RebuildBoundingSphere();
    }

    /**
     * Builds Carbon's inexpensive enclosing sphere from the path spheres.
     * @returns {sph3} the live local sphere
     */
    RebuildBoundingSphere()
    {
        if (!this.lines.length) return this._boundingSphere;

        const
            sphere = EveChildLineSet.global.sph3_0,
            center = EveChildLineSet.global.vec3_0;

        vec3.set(center, 0, 0, 0);
        let biggestRadius = 0;

        for (let i = 0; i < this.lines.length; i++)
        {
            this.lines[i].GetBoundingSphere(sphere);
            center[0] += sphere[0];
            center[1] += sphere[1];
            center[2] += sphere[2];
            biggestRadius = Math.max(biggestRadius, sphere[3]);
        }

        vec3.scale(center, center, 1 / this.lines.length);
        let distanceSquared = 0;

        for (let i = 0; i < this.lines.length; i++)
        {
            this.lines[i].GetBoundingSphere(sphere);
            distanceSquared = Math.max(distanceSquared, vec3.squaredDistance(center, sphere));
        }

        return sph3.set(
            this._boundingSphere,
            center[0],
            center[1],
            center[2],
            Math.sqrt(distanceSquared) + biggestRadius
        );
    }

    /**
     * Applies Carbon's line-set frustum and minimum-size policy.
     * @param {EveUpdateContext} updateContext
     * @param {Number} parentLodLevel
     * @param {mat4} [parentTransform]
     */
    UpdateLod(updateContext, parentLodLevel, parentTransform)
    {
        super.UpdateLod(updateContext, parentLodLevel, parentTransform);
        if (!this.display) return;

        this.PrepareLod(parentTransform);

        const
            frustum = updateContext.GetFrustum(),
            worldSphere = EveChildLineSet.global.sph3_1;

        sph3.transformMat4(worldSphere, this._boundingSphere, this._worldTransform);
        this.isVisible = frustum.IsSphereVisible(worldSphere, worldSphere[3]);

        if (this.isVisible)
        {
            // Carbon bug CE-01: cull the transformed sphere, but measure the
            // untransformed member sphere (EveChildLineSet.cpp:207-212).
            this.currentScreenSize = frustum.GetPixelSizeAcross(this._boundingSphere, this._boundingSphere[3]);
            this.isVisible = this.currentScreenSize >= this.minScreenSize;
        }

        for (let i = 0; i < this.lines.length; i++)
        {
            this.lines[i].UpdateVisibility(frustum, this.lodLevel, this._worldTransform);
        }
    }

    /** Refreshes the line system's current world transform for bounds queries. */
    PrepareLod(parentTransform)
    {
        if (this.useSRT && !this.staticTransform)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }
        if (parentTransform) mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
    }

    /** Restores the default visible state. */
    ResetLod()
    {
        super.ResetLod();
        this.isVisible = true;
        this.currentScreenSize = 1;

        for (let i = 0; i < this.lines.length; i++)
        {
            this.lines[i].ResetLod();
        }
    }

    /**
     * Gets the aggregate line-set sphere in world space.
     * @param {sph3} out
     * @returns {sph3} out
     */
    GetBoundingSphere(out)
    {
        return sph3.transformMat4(out, this._boundingSphere, this._worldTransform);
    }

    /**
     * Rebuilds the line set from the paths.
     *
     * Carbon (cpp:149-165) clears the set, marks it dynamic, lets each path add
     * its segments, then submits. ccpwgl's `EveObjectSet` marks itself dirty as
     * items are created and rebuilds inside its own `Update`, so the submit is
     * implicit - which is also why nothing here touches buffers directly.
     *
     * Brightness scales both colours before they reach the paths, exactly as
     * Carbon passes `m_baseColor * m_brightness` down.
     *
     * @returns {Boolean} true if the set was rebuilt
     */
    InitializeLineSet()
    {
        if (!this.lineSet) return false;
        this.lineSet.additive = this.additiveBatches;

        const
            g = EveChildLineSet.global,
            color = vec4.scale(g.vec4_0, this.baseColor, this.brightness),
            animColor = vec4.scale(g.vec4_1, this.animColor, this.brightness);

        this.lineSet.ClearItems({ skipEvents: true });

        for (let i = 0; i < this.lines.length; i++)
        {
            const path = this.lines[i];
            if (path) path.AddLinesToSet(this.lineSet, color, animColor, this.scrollSpeed);
        }

        // A line set built here rather than read from the file has never been
        // initialised, and an uninitialised set draws NOTHING - `Initialize` is
        // `UpdateValues(); Rebuild();` (`EveCurveLineSet.js:426-430`), and the
        // first half is what resolves the line effect. ccpwgl's own working
        // consumer does exactly this after adding its lines
        // (`TnyTransformGizmo.FinishLineSet`, `:2157-2161`), which is the
        // precedent to follow; `EveObjectSet.Update` alone only reaches Rebuild.
        this.lineSet.Initialize();

        return true;
    }

    /** Advances paths and refreshes visible lines and mesh instances. */
    Update(dt, parentTransform = EveChild.IDENTITY, perObjectData)
    {
        // Carbon composes the local transform from the SRT triple each frame unless
        // the child is static or opts out (`EveChildTransform::UpdateTransform`,
        // cpp:59-67); an authored `localTransform` is only used as-is in that case.
        if (this.useSRT && !this.staticTransform)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        mat4.copy(this._worldTransformLast, this._worldTransform);
        // Carbon (row-vector): local * parent, local first.
        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
        this._hasUpdated = true;

        let regenerated = false;

        for (let i = 0; i < this.lines.length; i++)
        {
            const path = this.lines[i];
            if (path && path.Update(dt)) regenerated = true;
        }

        if (!this.IsUpdating()) return;

        if (regenerated || this._updateLineSet)
        {
            this.GenerateManagedPoints();
            this._updateLineSet = false;
        }

        // Direct curve bindings and visibility changes need no OnModified call.
        if (this.renderType !== EveChildLineSet.RenderType.OBJECT_RENDER) this.InitializeLineSet();
        if (this.renderType !== EveChildLineSet.RenderType.LINE_RENDER) this.UpdateBuffer();

        if (this.lineSet)
        {
            // Places the set. The paths emitted their points through their own
            // `localTransform` only, so everything from this child upwards - its
            // own transform and the parent chain above it - arrives here.
            this.lineSet.UpdateViewDependentData(this._worldTransform);
            this.lineSet.Update(dt);
        }
    }

    /** Picks the generated mesh instances in their current world transforms. */
    Intersect(ray, intersects, _worldTransform, cache)
    {
        if (!this.IsUpdating() || !this._hasUpdated || ray.IsMasked(this)) return null;
        if (ray.GetOption("lineSets", "skip") || this.renderType === EveChildLineSet.RenderType.LINE_RENDER) return null;
        if (!this.mesh) return null;
        const before = intersects.length;
        const matrix = mat4.create();
        const world = mat4.create();
        for (let i = 0; i < this._instanceCount; i++)
        {
            this.GetInstanceTransform(i, matrix);
            if (mat4.determinant(matrix) === 0) continue;
            // Carbon (row-vector): instance * system, instance first.
            mat4.multiply(world, this._worldTransform, matrix);
            const at = intersects.length;
            this.mesh.Intersect(ray, intersects, world, {});
            for (let j = at; j < intersects.length; j++)
            {
                intersects[j].instanceIndex = i;
                if (!intersects[j].item) intersects[j].item = this;
                if (!intersects[j].name) intersects[j].name = this.name;
            }
        }
        return intersects.length > before ? intersects[before] : null;
    }

    /** Decodes one CPU instance for picking and attachment inspection. */
    GetInstanceTransform(index, out)
    {
        if (index < 0 || index >= this._instanceCount) return null;
        mat4.identity(out);
        for (let row = 0; row < 3; row++)
        {
            for (let column = 0; column < 4; column++)
            {
                out[column * 4 + row] = this._instanceData[index * 12 + row * 4 + column];
            }
        }
        return out;
    }

    /**
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.lineSet && this.lineSet.GetResources) this.lineSet.GetResources(out);
        if (this.mesh && this.mesh.GetResources) this.mesh.GetResources(out);
        return out;
    }

    /** Collects both render paths using the authored mesh area selection. */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.IsUpdating() || !this._hasUpdated) return false;
        let added = false;
        if (this.renderType !== EveChildLineSet.RenderType.OBJECT_RENDER && this.lineSet)
        {
            added = !!this.lineSet.GetBatches(mode, accumulator, perObjectData);
        }
        if (this.renderType === EveChildLineSet.RenderType.LINE_RENDER || !this.mesh || !this._instanceCount) return added;
        if (!this._perObjectData) this._perObjectData = new GLESPerObjectDataEveSpaceObject();
        const bag = GLESPerObjectDataEveSpaceObject.Unpack(perObjectData);
        bag.worldTransform = this._worldTransform;
        bag.worldTransformLast = this._worldTransformLast;
        bag.inverseWorldTransformTranspose = null;
        GLESPerObjectDataEveSpaceObject.Pack(bag, this._perObjectData);
        const owner = this;
        const forwarding = {
            length: 0,
            Commit(source)
            {
                const batch = new Tw2InstancedMeshBatch();
                batch.renderMode = source.renderMode;
                batch.perObjectData = source.perObjectData;
                batch.meshIx = source.meshIx;
                batch.start = source.start;
                batch.count = source.count;
                batch.effect = source.effect;
                batch.instanceMesh = owner;
                accumulator.Commit(batch);
                this.length++;
            }
        };
        this.mesh.GetBatches(mode, forwarding, this._perObjectData);
        return forwarding.length > 0 || added;
    }

    /** Builds the CPU stream; GPU upload is deferred until an actual draw. */
    UpdateBuffer()
    {
        let count = 0;
        for (const path of this.lines) count += path.GetPointCount();
        if (this._instanceData.length !== count * 12) this._instanceData = new Float32Array(count * 12);
        let offset = 0;
        for (const path of this.lines)
        {
            offset = path.UpdateBuffer(this._instanceData, offset, this._worldTransform, device.eyePosition);
        }
        this._instanceCount = count;
        this._instanceDataDirty = true;
        const geometry = this.mesh && this.mesh.geometryResource;
        const meshData = geometry && geometry.IsGood() && geometry.meshes[this.mesh.meshIndex];
        if (meshData)
        {
            for (const path of this.lines) path.CalculateBoundingSphere(meshData.boundsSphereRadius);
            this.RebuildBoundingSphere();
        }
    }

    /** Realizes TEXCOORD8..10, aliasing previous transform rows at 11..13. */
    RenderAreas(meshIndex, start, count, effect, technique)
    {
        const geometry = this.mesh && this.mesh.geometryResource;
        if (!geometry || !geometry.IsGood() || !this._instanceCount) return false;
        const gl = device.gl;
        if (!this._instanceDeclaration)
        {
            const elements = [];
            for (let i = 0; i < 6; i++) elements.push({ usage: "TEXCOORD", usageIndex: 8 + i, elements: 4 });
            this._instanceDeclaration = Tw2VertexDeclaration.from(elements);
            for (let i = 0; i < 6; i++) this._instanceDeclaration.elements[i].offset = (i % 3) * 16;
            this._instanceDeclaration.stride = 48;
        }
        if (!this._instanceBuffer)
        {
            this._instanceBuffer = gl.createBuffer();
            this._instanceDataDirty = true;
        }
        if (this._instanceDataDirty)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._instanceBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._instanceData, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this._instanceDataDirty = false;
        }
        return geometry.RenderAreasInstanced(meshIndex, start, count, effect, technique,
            this._instanceBuffer, this._instanceDeclaration, 48, this._instanceCount);
    }

    /** Releases owned buffers; retained CPU records support the next draw. */
    Unload()
    {
        if (this._instanceBuffer) device.gl.deleteBuffer(this._instanceBuffer);
        this._instanceBuffer = null;
        if (this.lineSet) this.lineSet.Unload();
    }

    /** Carbon's shader validation surface reports the current transform rows. */
    GetVertexElementAddedThroughCode()
    {
        return [ [ 5, 8 ], [ 5, 9 ], [ 5, 10 ] ];
    }

    /**
     * @returns {Boolean}
     */
    HasTransparentBatches()
    {
        if (!this.display) return false;
        return (this.renderType !== EveChildLineSet.RenderType.OBJECT_RENDER && !!this.lineSet && !this.additiveBatches)
            || (this.renderType !== EveChildLineSet.RenderType.LINE_RENDER && !!this.mesh && this.mesh.transparentAreas.length > 0);
    }

    static global = {
        vec4_0: vec4.create(),
        vec4_1: vec4.create(),
        vec3_0: vec3.create(),
        sph3_0: sph3.create(),
        sph3_1: sph3.create()
    };

    /**
     * Carbon `EveChildLineSet::lineSetType` (`EveChildLineSet.h:92-97`).
     * @type {Object<String:Number>}
     */
    static RenderType = {
        OBJECT_RENDER: 0,
        LINE_RENDER: 1,
        BOTH: 2
    };

}
