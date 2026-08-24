import { meta } from "utils";
import { device, tw2 } from "global";
import { vec3, vec4, mat4, quat } from "math";
import { GLESPerObjectDataEveSpaceObject } from "core";
import { EveEffectRoot2 } from "./EveEffectRoot2";


/**
 * A planet.
 *
 * Ported from Carbon `trinity/trinity/Eve/EvePlanet.{h,cpp,_Blue.cpp}`, on top
 * of the ported `EveEffectRoot2` it extends. Carbon's class is small - six
 * persisted values and a handful of overrides - because a planet IS an effect
 * root: the surface, clouds, atmosphere and rings are all effect children, and
 * the template supplies them.
 *
 * REPLACES A CLASS THAT WAS NOT A PORT. The previous EvePlanet carried
 * `highDetail`, `heightMap`, `effectHeight`, `resolution` and a render-target
 * bake, none of which exist in Carbon. The backup is `EveOldPlanet.js`.
 *
 * Two findings from the shipped data made the rewrite safe rather than a leap:
 *
 *   1. Every planet template IS an `EvePlanet` - root `_type` "EvePlanet",
 *      model in `effectChildren` as `EveChildMesh`/`EveChildContainer` over
 *      `planetsphere.gr2`. So `Fetch` adopts a template rather than nesting one
 *      inside a wrapper. (554 templates under `template/`, 441 under
 *      `template_hi/`.)
 *   2. The `HeightMap` parameter the surface shaders take is a DUMMY in almost
 *      every template - `res:/texture/global/black.dds` for terrestrial, ice,
 *      lava, ocean, plasma, sandstorm, shattered and thunder; only gas giants
 *      bind a real one, and it is a shipped .dds. So the bake was computing a
 *      texture the data already provides, and dropping it loses nothing.
 *
 * The bake could not have worked on dx11 in any case: the whole precompute
 * stage - every `*blitheight` and `*export` shader - ships only in the gles2
 * tree, which is why a planet would not load on the dx11 profile at all.
 */
@meta.define("EvePlanet", true)
@meta.stage(2)
export class EvePlanet extends EveEffectRoot2
{

    /**
     * Carbon default 1 (`cpp:25`), not 0. It is the planet's TRUE radius in
     * metres and is used unscaled for secondary lighting, so it must not be
     * confused with the bounding radius `EveEffectRoot2` carries.
     */
    @meta.float
    radius = 1;

    /**
     * Used for secondary lighting only - the light a planet bounces back into
     * the scene. Carbon default is fully transparent black (`cpp:23`).
     */
    @meta.color
    albedoColor = vec4.create();

    /**
     * The planet's own emitted light, again for secondary lighting (`cpp:24`).
     */
    @meta.color
    emissiveColor = vec4.create();

    /**
     * Below this many pixels across, the surface is not drawn at all.
     * Carbon default 2.0 (`cpp:26`).
     */
    @meta.float
    minScreenSize = 2.0;

    /**
     * The depth-only proxy. Carbon types this `EveChildMeshPtr`, and the
     * templates author it inline as an `EveChildMesh` over `PlanetSphere.gr2`
     * bound to `PlanetZOnly.fx` - the old class declared it an `EveTransform`
     * and loaded `planetZOnly.black` separately, which is why the type differs
     * from the backup.
     */
    @meta.struct("EveChildMesh")
    zOnlyModel = null;

    /**
     * READ|PERSIST in Carbon (`_Blue.cpp:46-50`) - persisted, but computed
     * every frame rather than authored. The authored value is a starting point,
     * nothing more.
     */
    @meta.float
    estimatedPixelDiameter = 0;


    /**
     * NON-CARBON. The SDE item id of the celestial this planet stands for.
     * Carbon has no such field - a planet in the client knows its item from the
     * session - but ccpwgl is handed one by its consumers (`TnyMoon` passes it
     * to `Fetch`) and the old class persisted it, so it is kept.
     */
    @meta.uint
    itemID = 0;


    /**
     * Carbon's SCALE (`cpp:12`): planets are rendered in a space a million
     * times smaller than the world, so that a body 1e11 metres away lands
     * somewhere float precision can still resolve.
     * @type {Number}
     */
    static SCALE = 1000000;

    /**
     * The narrowest field of view the client allows (`cpp:15`). Used for the
     * SECOND pixel-diameter estimate - the largest the planet could become
     * without moving.
     * @type {Number}
     */
    static FOV_MIN = 0.65;

    /** Carbon clamps distance and radius against this (`cpp:212,218`). */
    static EPSILON = 1e-5;

    /**
     * The depth-only proxy, for a template that does not author one.
     * @type {String}
     */
    static zOnlyModelPath = "res:/dx9/model/worldObject/planet/planetZOnly.black";


    /**
     * Carbon runs planets at {@link SCALE} and scales the CAMERA to match
     * (`EveSpaceScene.cpp:3905-3913`). ccpwgl solves the same precision problem
     * a different way - its planet pass keeps world scale and swaps in a far
     * depth range instead, `zn 10000, zf 1e11` over depth 0.9..1
     * (`EveSpaceScene.js:1153-1188`) - and does NOT scale the view position.
     *
     * So the render scale defaults to 1 here, which makes
     * {@link CalculatePlanetScaleTransform} an exact identity. Setting it
     * without also scaling the camera would simply put the planet in the wrong
     * place. {@link SetRenderScale} exists for a consumer that does both.
     *
     * @type {Number}
     */
    _renderScale = 1;

    _estimatedMaxPixelDiameter = 0;

    // The planet's world transform, built from the curves and its own SRT. Kept
    // separate from `_worldTransform` because Carbon's planet builds it
    // directly rather than through the effect root's parent chain.
    _planetTransform = mat4.create();

    // The same, divided by the render scale - what the effect children are
    // placed in. Identical to the above while renderScale is 1.
    _scaledTransform = mat4.create();

    // Carbon evaluates its ball curves at the update context's time; ccpwgl's
    // view-dependent pass is handed no clock, so one is accumulated in Update.
    _time = 0;

    _resPath = "";
    _atmospherePath = "";


    /**
     * Sets the render scale. Only meaningful to a caller that scales the view
     * position by the same factor - see the note on {@link _renderScale}.
     * Carbon `SetRenderScale` (`cpp:307-310`).
     * @param {Number} value
     * @returns {EvePlanet}
     */
    SetRenderScale(value)
    {
        this._renderScale = value > 0 ? value : 1;
        return this;
    }

    /**
     * Carbon `CalculatePlanetScaleTransform` (`cpp:114-118`):
     * `worldTransform * ScalingMatrix(1/renderScale)`.
     *
     * Carbon composes row-vector, so that reads "apply the world transform,
     * THEN the scale" - and gl-matrix composes the other way, so the operands
     * swap. Getting it backwards leaves the TRANSLATION unscaled while still
     * scaling the basis, which looks entirely reasonable and puts the planet
     * in the wrong place. Pinned by `scripts/test-planet-scale-and-lod.js`.
     *
     * @param {mat4} out
     * @param {mat4} worldTransform
     * @param {Number} [renderScale]
     * @returns {mat4} out
     */
    CalculatePlanetScaleTransform(out, worldTransform, renderScale = this._renderScale)
    {
        if (renderScale === 1) return mat4.copy(out, worldTransform);

        const s = 1 / renderScale;
        mat4.identity(EvePlanet.global.mat4_scale);
        EvePlanet.global.mat4_scale[0] = s;
        EvePlanet.global.mat4_scale[5] = s;
        EvePlanet.global.mat4_scale[10] = s;

        return mat4.multiply(out, EvePlanet.global.mat4_scale, worldTransform);
    }

    /**
     * The pixel diameter of the planet at a given distance.
     * Carbon `EstimatePixelDiameterDist` (`cpp:202-223`).
     *
     * `scale` divides the RADIUS, so the distance passed in must be measured in
     * the same scaled space or the answer is out by exactly that factor.
     *
     * @param {Number} scaledDistance
     * @param {Number} tanFOV - tan(fov / 2)
     * @param {Number} scale
     * @returns {Number} diameter in pixels
     */
    EstimatePixelDiameterDist(scaledDistance, tanFOV, scale)
    {
        const
            { EPSILON } = EvePlanet,
            halfWidthProjection = device.viewportWidth * 0.5 / tanFOV,
            radius = this.radius / scale;

        if (scaledDistance < EPSILON) scaledDistance = EPSILON;
        if (radius < EPSILON) return 0;

        return (radius / scaledDistance) * halfWidthProjection * 2;
    }

    /**
     * The same, from a position rather than a distance.
     * Carbon `EstimatePixelDiameterPos` (`cpp:184-191`).
     * @param {vec3} scaledPlanetCenter
     * @param {Number} tanFOV
     * @param {Number} scale
     * @returns {Number}
     */
    EstimatePixelDiameterPos(scaledPlanetCenter, tanFOV, scale)
    {
        const cameraPosition = vec3.transformMat4(EvePlanet.global.vec3_camera, [ 0, 0, 0 ], device.viewInverse);
        return this.EstimatePixelDiameterDist(vec3.distance(scaledPlanetCenter, cameraPosition), tanFOV, scale);
    }

    /**
     * Chooses the detail level from the planet's apparent size.
     * Carbon `UpdateLOD` (`cpp:274-290`).
     *
     * The comparison is STRICTLY greater, so a planet exactly at the minimum is
     * low detail and draws nothing. A hidden planet does not choose at all -
     * Carbon returns before touching the level, leaving whatever was last set.
     *
     * ccpwgl's `_lod` is a number where 3 is full detail and 0 is none, which
     * the existing `!this._lod` guards read as "invisible".
     *
     * @returns {Number} the chosen lod
     */
    UpdateLOD()
    {
        if (!this.display) return this._lod;

        this.SetLod(this.estimatedPixelDiameter > this.minScreenSize ? 3 : 0);
        return this._lod;
    }

    /**
     * Carbon `SetLod` (`cpp:292-305`) - the level, then every effect child, then
     * the z-only model.
     * @param {Number} lod
     */
    SetLod(lod)
    {
        this._lod = lod;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.ChangeLOD) child.ChangeLOD(lod);
        }

        if (this.zOnlyModel && this.zOnlyModel.ChangeLOD) this.zOnlyModel.ChangeLOD(lod);
    }

    /**
     * The scene drives LOD from apparent size rather than from the frustum, so
     * the frustum argument is accepted and unused. Overrides the base, which
     * pins full detail.
     * @param {Tw2Frustum} [frustum]
     */
    UpdateLod(frustum)
    {
        this.UpdateLOD();
    }

    /**
     * Resets to full detail.
     */
    ResetLod()
    {
        this.SetLod(3);
    }

    /**
     * Carbon `GetRadius` (`cpp:351`) - the planet's OWN radius, not the effect
     * root's bounding sphere.
     * @returns {Number}
     */
    GetRadius()
    {
        return this.radius;
    }

    /**
     * Carbon `GetWorldRotation` (`cpp:148-151`) returns the raw authored
     * rotation, NOT the composed world rotation the effect root returns.
     * @param {quat} out
     * @returns {quat} out
     */
    GetWorldRotation(out)
    {
        return quat.copy(out, this.rotation);
    }

    /**
     * Carbon `GetWorldBoundingBox` (`cpp:153-167`): a sphere at the SCALED
     * centre with a scaled radius, and no transform applied afterwards.
     * @param {box3} out
     * @returns {?box3}
     */
    GetWorldBoundingBox(out)
    {
        if (this.radius <= 0) return null;

        const
            renderScale = this._renderScale > 0 ? this._renderScale : 1,
            centre = mat4.getTranslation(EvePlanet.global.vec3_centre, this._scaledTransform),
            r = this.radius / renderScale;

        out[0] = centre[0] - r;
        out[1] = centre[1] - r;
        out[2] = centre[2] - r;
        out[3] = centre[0] + r;
        out[4] = centre[1] + r;
        out[5] = centre[2] + r;

        return out;
    }

    /**
     * Carbon `IsBoundingBoxReady` (`cpp:169-172`) - the radius, not the
     * bounding sphere the effect root would test.
     * @returns {Boolean}
     */
    IsBoundingBoxReady()
    {
        return this.radius > 0;
    }

    /**
     * The planet's local bounds are its SPHERE, not the union of its effect
     * children's.
     *
     * Carbon says so twice: `GetWorldBoundingBox` builds the box straight from
     * `m_radius` (`cpp:153-167`) and `IsBoundingBoxReady` tests the radius
     * rather than the bounding sphere the effect root would use
     * (`cpp:169-172`). It is also the only answer that is right before the
     * template's meshes have loaded - a planet knows how big it is from the
     * moment it is told its radius.
     */
    OnRebuildBounds()
    {
        const r = this.radius > 0 ? this.radius : 0;

        this._boundingSphere[0] = 0;
        this._boundingSphere[1] = 0;
        this._boundingSphere[2] = 0;
        this._boundingSphere[3] = r;

        this._boundingBox[0] = -r;
        this._boundingBox[1] = -r;
        this._boundingBox[2] = -r;
        this._boundingBox[3] = r;
        this._boundingBox[4] = r;
        this._boundingBox[5] = r;

        this._boundsDirty = r <= 0;
    }

    /**
     * Ray intersection, for picking.
     *
     * Duck-typed by `Tw2RayCaster` (`Tw2RayCaster.js:399-401`), so a planet
     * without this is silently unpickable rather than an error - which matters
     * once `treatPlanetsAsObjects` puts one in `scene.objects`.
     *
     * Tests the planet's own sphere. The old class tested the rebuilt bounds
     * union, which for a planet is the same sphere by way of a great deal more
     * work.
     *
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @returns {?Object}
     */
    Intersect(ray, intersects)
    {
        if (!this.display || this._lod < 1 || ray.IsMasked(this)) return null;
        if (this.radius <= 0) return null;

        this.RebuildBounds();

        const intersect = ray.IntersectSph3(this._boundingSphere, this._planetTransform);
        if (!intersect) return null;

        intersect.name = this.name;
        intersect.item = this;
        intersects.push(intersect);
        return intersect;
    }

    /**
     * Gets resources.
     * @param {Array} [out=[]]
     * @returns {Array} out
     */
    GetResources(out = [])
    {
        super.GetResources(out);
        if (this.zOnlyModel && this.zOnlyModel.GetResources) this.zOnlyModel.GetResources(out);
        return out;
    }

    /**
     * Builds the planet's world transform and its scaled counterpart, then
     * measures how big it appears and picks a detail level.
     *
     * Carbon splits this across `UpdatePlanetSyncronous` (`cpp:68-110`, the
     * transform) and `UpdatePlanetVisibility` (`cpp:120-132`, the measurement);
     * ccpwgl calls this once per frame from its planet pass, so both happen
     * here.
     *
     * The transform is built DIRECTLY from the curves plus the authored SRT -
     * Carbon adds the ball translation to `m_translation` and multiplies the
     * ball rotation onto `m_rotation`, rather than going through the effect
     * root's parent chain.
     *
     * @param {mat4} parentTransform
     * @param {Number} [dt]
     */
    UpdateViewDependentData(parentTransform, dt)
    {
        const
            g = EvePlanet.global,
            translation = vec3.copy(g.vec3_translation, this.translation),
            rotation = quat.copy(g.quat_rotation, this.rotation);

        // Carbon: translation += m_translation, rotation = Normalize(ball * m_rotation).
        // Row-vector composition again, so the quaternion operands swap.
        if (this.translationCurve && this.translationCurve.GetValueAt)
        {
            const ball = this.translationCurve.GetValueAt(this._time, g.vec3_ball);
            if (ball) vec3.add(translation, translation, ball);
        }

        if (this.rotationCurve && this.rotationCurve.GetValueAt)
        {
            const ball = this.rotationCurve.GetValueAt(this._time, g.quat_ball);
            if (ball) quat.normalize(rotation, quat.multiply(rotation, rotation, ball));
        }

        mat4.fromRotationTranslationScale(this._planetTransform, rotation, translation, this.scaling);

        if (parentTransform)
        {
            mat4.copy(this._parentTransform, parentTransform);
            mat4.multiply(this._planetTransform, parentTransform, this._planetTransform);
        }

        // The effect root's own world transform follows, so anything inherited
        // that reads `_worldTransform` - the light collection, most of all -
        // sees the same placement.
        mat4.copy(this._worldTransform, this._planetTransform);
        this.CalculatePlanetScaleTransform(this._scaledTransform, this._planetTransform);

        // Both estimates, exactly as Carbon takes them: the live field of view
        // and the narrowest the client allows. `1 / projection[0]` is Carbon's
        // `1 / proj._11` - the same element, because the two layouts are
        // byte-identical.
        const
            centre = mat4.getTranslation(g.vec3_centre, this._scaledTransform),
            liveTanFOV = device.projection[0] !== 0 ? 1 / device.projection[0] : 1;

        this.estimatedPixelDiameter = this.EstimatePixelDiameterPos(centre, liveTanFOV, this._renderScale);
        this._estimatedMaxPixelDiameter = this.EstimatePixelDiameterPos(
            centre,
            Math.tan(EvePlanet.FOV_MIN / 2),
            this._renderScale
        );

        this.UpdateLOD();

        this.PackPerObjectData();

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.UpdateViewDependentData) child.UpdateViewDependentData(this._scaledTransform, dt);
        }

        // The z-only model stays in ORDINARY world space - it is drawn in the
        // main pass under the scene's normal projection, so a scaled transform
        // would put its depth somewhere unrelated to the geometry it is meant
        // to occlude. Carbon does the same (`cpp:60-64`, `cpp:134-140`).
        if (this.zOnlyModel && this.zOnlyModel.UpdateViewDependentData)
        {
            this.zOnlyModel.UpdateViewDependentData(this._planetTransform, dt);
        }
    }

    /**
     * Fills the per-object buffer the effect children are drawn with.
     *
     * Inherited from `EveEffectRoot2` in shape, but the transform is the SCALED
     * one, because that is the space the children were placed in.
     */
    PackPerObjectData()
    {
        const bag = this._perObjectDataBag;
        bag.worldTransform = this._scaledTransform;
        bag.worldTransformLast = this._worldTransformLast;

        mat4.copy(this._worldTransformLast, this._scaledTransform);

        GLESPerObjectDataEveSpaceObject.Pack(bag, this._perObjectData);
    }

    /**
     * Per frame update.
     *
     * Carbon `UpdatePlanetSyncronous` (`cpp:68-110`) - curve sets, controllers,
     * observers, then the children. Note it updates its controllers at a FIXED
     * rate of 0.5 rather than from LOD; ccpwgl's controllers advance their own
     * clock from the argument, so they get `dt`, as everywhere else here.
     *
     * @param {Number} dt
     */
    Update(dt)
    {
        this._time += dt || 0;

        if (this.controllers.length)
        {
            if (!this._controllersLinked) this.Initialize();

            for (let i = 0; i < this.controllers.length; i++)
            {
                this.controllers[i].Update(dt);
            }
        }

        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].UpdateDelta(dt);
        }

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child) child.Update(dt, this._scaledTransform, this._perObjectData, this);
        }

        if (this.zOnlyModel && this.zOnlyModel.Update)
        {
            this.zOnlyModel.Update(dt, this._planetTransform, this._perObjectData, this);
        }

        for (let i = 0; i < this.observers.length; i++)
        {
            const observer = this.observers[i];
            if (observer && observer.Update) observer.Update(this._planetTransform);
        }
    }

    /**
     * Gets the planet's surface batches.
     *
     * Carbon `GetRenderables` (`cpp:243-262`): displayed, at full detail, AND
     * bigger than `minScreenSize`. All three, and the size test is the one the
     * z-only pass below deliberately omits.
     *
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || this._lod < 3) return false;
        if (this.estimatedPixelDiameter <= this.minScreenSize) return false;

        const c = accumulator.length;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            const child = this.effectChildren[i];
            if (child && child.GetBatches) child.GetBatches(mode, accumulator, this._perObjectData);
        }

        return accumulator.length !== c;
    }

    /**
     * Gets the depth-only batches.
     *
     * Carbon `GetZOnlyRenderables` (`cpp:225-241`): displayed and at full
     * detail, with NO size test. That asymmetry is deliberate - a planet too
     * small to draw its surface still writes depth, so it still occludes what
     * is behind it. Removing the difference is what stops planets occluding.
     *
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetZOnlyBatches(mode, accumulator)
    {
        if (!this.display || this._lod < 3 || !this.zOnlyModel) return false;
        if (!this.zOnlyModel.GetBatches) return false;

        const c = accumulator.length;
        this.zOnlyModel.GetBatches(mode, accumulator, this._perObjectData);
        return accumulator.length !== c;
    }

    /**
     * Fetches a planet.
     *
     * A template IS an `EvePlanet` - root `_type` "EvePlanet", model in
     * `effectChildren` - so this ADOPTS what one carries rather than nesting a
     * planet inside a planet. The old class discovered the same thing and
     * worked around it by keeping both a `highDetail` transform and the adopted
     * children; there is no wrapper here to work around.
     *
     * `heightMap1` / `heightMap2` are accepted and IGNORED. They fed the bake,
     * which is gone: the shaders' `HeightMap` parameter is authored in the
     * template - a dummy `res:/texture/global/black.dds` for every planet type
     * but gas giants, which bind a real shipped .dds.
     *
     * @param {Object} options
     * @param {String} [options.name]
     * @param {Number} [options.itemID]
     * @param {Number} [options.radius]
     * @param {String} [options.resPath] - the TEMPLATE, which SDE calls a shaderPreset
     * @param {String} [options.atmospherePath]
     * @returns {Promise<EvePlanet>}
     */
    async Fetch(options = {})
    {
        const {
            name = "",
            itemID = 0,
            radius = 0,
            resPath = "",
            atmospherePath = ""
        } = options;

        this.name = name;
        this.itemID = itemID;
        if (radius) this.radius = radius;
        this._resPath = resPath;
        this._atmospherePath = atmospherePath;

        const [ template, atmosphere ] = await tw2.FetchAll([
            [ resPath, true ],
            [ atmospherePath, true ]
        ]);

        if (template) this.Adopt(template);

        // A template that authors no depth proxy gets the shared one. Carbon
        // relies on the template carrying it - the moon templates do, inline -
        // but not every type does, and a planet with no z-only model silently
        // stops occluding.
        if (!this.zOnlyModel)
        {
            const proxy = await tw2.Fetch(EvePlanet.zOnlyModelPath).catch(() => null);
            if (proxy)
            {
                this.zOnlyModel = proxy.zOnlyModel
                    || (proxy.effectChildren && proxy.effectChildren[0])
                    || null;
            }
        }

        if (atmosphere) this.effectChildren.push(atmosphere);

        this._boundsDirty = true;
        this.Initialize();

        return this;
    }

    /**
     * Takes over what a template carries.
     *
     * Every list is CONCATENATED rather than replaced, so a caller that has
     * already added something of its own keeps it.
     *
     * @param {EvePlanet} template
     * @returns {EvePlanet}
     */
    Adopt(template)
    {
        if (!template) return this;

        for (const key of [ "effectChildren", "curveSets", "controllers", "observers" ])
        {
            const list = template[key];
            if (Array.isArray(list) && list.length) this[key].push(...list);
        }

        if (!this.zOnlyModel && template.zOnlyModel) this.zOnlyModel = template.zOnlyModel;

        // The template's own authored values, where the caller supplied none.
        //
        // `radius` is deliberately NOT taken, and the data says why:
        // `template/moon/p_moon_01.black` authors radius = 7.15e22, which is
        // not a length in metres in any sense the renderer means. The caller
        // knows the real celestial's radius; a template's is whatever the
        // artist happened to leave there, and adopting it would put the planet
        // astronomically out of scale AND feed the pixel-diameter estimate,
        // pinning the LOD at full detail forever.
        if (template.minScreenSize !== undefined) this.minScreenSize = template.minScreenSize;
        if (template.albedoColor) vec4.copy(this.albedoColor, template.albedoColor);
        if (template.emissiveColor) vec4.copy(this.emissiveColor, template.emissiveColor);

        return this;
    }

    /**
     * Scratch. Separate from `EveObject.global` so a planet's working values
     * cannot be clobbered mid-frame by another object using the shared set.
     * @type {Object}
     */
    static global = {
        vec3_translation: vec3.create(),
        vec3_ball: vec3.create(),
        vec3_centre: vec3.create(),
        vec3_camera: vec3.create(),
        quat_rotation: quat.create(),
        quat_ball: quat.create(),
        mat4_scale: mat4.create()
    };

}
