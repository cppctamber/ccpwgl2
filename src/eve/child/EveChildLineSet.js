// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildLineSet.cpp
import { meta } from "utils";
import { EveChild } from "./EveChild";
import { mat4, vec3, vec4, quat } from "math";
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
@meta.type("EveChildLineSet")
@meta.define({
    wgl: "EveChildLineSet",
    ccp: true
})
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

    @meta.notImplemented
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
        if (!this.lineSet) this.lineSet = new EveCurveLineSet();
        this.lineSet.additive = this.additiveBatches;

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
            if (path && path.GeneratePoints) path.GeneratePoints(this._worldTransform);
        }
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
        vec4_1: vec4.create()
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
