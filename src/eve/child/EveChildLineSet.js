// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildLineSet.cpp
import { meta } from "utils";
import { EveChild } from "./EveChild";
import { mat4, sph3, vec3, vec4, quat } from "math";
import { EveCurveLineSet } from "eve/item/EveCurveLineSet";


/**
 * An effect child that draws lines along a set of authored shapes.
 *
 * It does NOT implement line rendering. Carbon's `EveChildLineSet` owns an
 * `EveCurveLineSet` (`EveChildLineSet.h:113`) and every line it draws is added to
 * that set; the class itself is a transform, a colour/brightness/scroll
 * modulation, and a list of `IEveLineSetPath` shapes that turn parameters into
 * points. ccpwgl's `EveCurveLineSet` is a full implementation already, so the
 * work here is the wiring:
 *
 *     GenerateManagedPoints:  each path -> GeneratePoints(worldTransform)
 *     InitializeLineSet:      clear the set, each path -> AddLinesToSet(...), rebuild
 *
 * `renderType` is Carbon's `lineSetType` enum: OBJECT_RENDER 0, LINE_RENDER 1,
 * BOTH 2. Only the line half is implemented. The object half instances `mesh` at
 * every generated point through a per-instance transform buffer
 * (`EveChildLineSet::UpdateBuffer`, `IEveLineSetPath::UpdateBuffer`) - real GPU
 * instancing, the same mechanism `EveChildInstanceMeshRenderer` needs, and NOT
 * what `EveChildInstanceContainer` does despite the name (that one copies whole
 * child objects). A `renderType` that asks for objects draws whatever lines it
 * also asks for and nothing else, rather than failing.
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

    @meta.notImplemented
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
        for (let i = 0; i < this.lines.length; i++)
        {
            const path = this.lines[i];
            if (!path) continue;
            path.GeneratePoints(this._worldTransform);
            path.CalculateBoundingSphere();
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
        if (!this.lineSet || !this.lines.length) return false;

        const
            g = EveChildLineSet.global,
            color = vec4.scale(g.vec4_0, this.baseColor, this.brightness),
            animColor = vec4.scale(g.vec4_1, this.animColor, this.brightness);

        this.lineSet.ClearItems({ skipEvents: true });

        for (let i = 0; i < this.lines.length; i++)
        {
            const path = this.lines[i];
            if (path && path.AddLinesToSet) path.AddLinesToSet(this.lineSet, color, animColor, this.scrollSpeed);
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

    /**
     * Per frame update.
     *
     * Carbon splits this across `UpdateSyncronous` (advance the paths, rebuild
     * the set) and `UpdateAsyncronous` (compose the transform), and rebuilds the
     * set EVERY frame for a line-rendering child (cpp:288-291). This rebuilds
     * only when a path reports that it regenerated, or when something set
     * `_updateLineSet`.
     *
     * That divergence is deliberate. Carbon submits into a dynamic vertex buffer;
     * ccpwgl's `EveObjectSet.Rebuild` re-creates its buffers, so doing it per
     * frame would cost far more here than it does there, for an identical result
     * whenever nothing moved. A scrolling line animates through the line item's
     * own animation parameters, not through a rebuild, so a static path with
     * `scrollSpeed` still scrolls.
     *
     * @param {Number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} [perObjectData]
     */
    Update(dt, parentTransform, perObjectData)
    {
        // Carbon composes the local transform from the SRT triple each frame unless
        // the child is static or opts out (`EveChildTransform::UpdateTransform`,
        // cpp:59-67); an authored `localTransform` is only used as-is in that case.
        if (this.useSRT && !this.staticTransform)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
        this._hasUpdated = true;

        let regenerated = false;

        for (let i = 0; i < this.lines.length; i++)
        {
            const path = this.lines[i];
            if (path && path.Update && path.Update(dt)) regenerated = true;
        }

        if (!this.IsUpdating()) return;

        if (regenerated || this._updateLineSet)
        {
            this.GenerateManagedPoints();
            this.InitializeLineSet();
            this._updateLineSet = false;
        }

        if (this.lineSet)
        {
            // Places the set. The paths emitted their points through their own
            // `localTransform` only, so everything from this child upwards - its
            // own transform and the parent chain above it - arrives here.
            this.lineSet.UpdateViewDependentData(this._worldTransform);
            this.lineSet.Update(dt);
        }
    }

    /**
     * Intersects this child.
     *
     * The incoming `worldTransform` is the PARENT's, and is deliberately not
     * used: `_worldTransform` is rebuilt every frame by Update and already
     * carries the parent, the bone and every transform modifier. Composing
     * the parent again would apply it twice, and re-deriving from
     * `localTransform` would answer the bind pose for anything animated -
     * which is exactly the case a hit test on a moving part has to get right.
     *
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} [_worldTransform] - the parent's, unused; see above
     * @param {Object} [cache]
     * @returns {?Object} the intersection, if any
     */
    Intersect(ray, intersects, _worldTransform, cache)
    {
        if (!this.display || !this.isVisible || ray.IsMasked(this)) return null;
        if (ray.GetOption("lineSets", "skip")) return null;

        const target = this.mesh;
        if (!target || !target.Intersect) return null;

        const before = intersects.length;
        target.Intersect(ray, intersects, this._worldTransform, cache);

        // Name the child rather than the mesh: a caller picking in a scene
        // wants the thing it can select, and the mesh is an implementation
        // detail of it.
        for (let i = before; i < intersects.length; i++)
        {
            if (!intersects[i].item) intersects[i].item = this;
            if (!intersects[i].name) intersects[i].name = this.name || "";
        }

        // No segment of its own: a parent names its children, because only
        // the parent knows which property they hang off. This is a leaf.
        return intersects.length > before ? intersects[before] : null;
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

    /**
     * Hands the contained line set's batches up.
     *
     * Carbon reaches the same place by a different route: its `GetBatches` serves
     * only the instanced-object half, and the lines arrive because
     * `GetRenderables` (cpp:221-246) pushes `m_lineSet` into the renderable list
     * as a peer. ccpwgl has no renderable list - children are asked for batches
     * directly - so the set is forwarded here instead. Same guard either way:
     * `LINE_RENDER != m_type` is what suppresses the lines, and it is the only
     * thing `renderType` gates on this path.
     *
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches were accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.IsUpdating() || !this._hasUpdated) return false;
        if (this.renderType === EveChildLineSet.RenderType.OBJECT_RENDER) return false;
        if (!this.lineSet) return false;

        return !!this.lineSet.GetBatches(mode, accumulator, perObjectData);
    }

    /**
     * @returns {Boolean}
     */
    HasTransparentBatches()
    {
        return !!this.lineSet && !this.additiveBatches;
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
