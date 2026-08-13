import { meta } from "utils";
import { device, tw2 } from "global";
import { vec3, vec4, quat, mat4 } from "math";
import { Tw2CarbonLightCollector } from "core/carbon/Tw2CarbonLightCollector";
import { Tw2CarbonResourceBinder } from "core/carbon/Tw2CarbonResourceBinder";
import { Tw2CarbonShadowRenderer } from "core/carbon/Tw2CarbonShadowRenderer";
import { EveSpaceSceneShadowHandler } from "./EveSpaceSceneShadowHandler";
import { EveSpaceSceneDepthHandler } from "./EveSpaceSceneDepthHandler";
import { ComputeAutoNearFar, GetSceneBoundingSphere } from "./EveSceneNearFar";
import { EveSpaceSceneAO, DEFAULT_AO_POST_EFFECT } from "./post/ao";
import {
    Tw2BatchAccumulator,
    Tw2RawData,
    Tw2Frustum,
    Tw2BatchAccumulator2,
    Tw2RenderBatchContext,
    Tw2DepthRenderTarget,
    Tw2Effect,
    Tw2PostProcess, Tw2PostProcessRenderer, Tw2GodRaysRenderer, Tw2TextureRes, Tw2TextureParameter, Tw2RenderTarget
} from "core";
import {
    RM_DECAL,
    RM_DEPTH,
    RM_DISTORTION,
    RM_OPAQUE
} from "constant";


@meta.type("EveSpaceScene")
@meta.define({
    wgl: "EveSpaceScene",
    ccp: true
})
export class EveSpaceScene extends meta.Model
{

    @meta.struct("Tw2Effect")
    backgroundEffect = null;

    @meta.list("EveObject")
    backgroundObjects = [];

    @meta.boolean
    @meta.isPrivate
    backgroundRenderingEnabled = true;

    @meta.notImplemented
    @meta.boolean
    enableShadows = true;

    /**
     * Carbon cascaded sun shadows (dx11 profile only).
     *
     * These forward to `Tw2CarbonShadowRenderer`, which draws casters into a
     * cascade atlas and resolves it to the screen-space R8 visibility buffer
     * that object shaders sample. Contract:
     * `/docs/contracts/carbon-shadow-resolve.md`.
     *
     * Nothing here has any effect on the gles2 profile: the registers these
     * drive live in Carbon's PerFramePS, which is only uploaded for Carbon
     * passes.
     */
    @meta.boolean
    carbonShadows = false;

    /**
     * How far shadows reach, in scene units.
     *
     * **This is deliberately NOT derived from the camera far plane.** EVE
     * cameras see millions of metres, and cascades spread over that range are
     * useless: at a 100000 range the four splits land near 18, 316, 5600 and
     * 100000, so a 300m ship sits in a cascade about 5km wide - roughly 5m per
     * texel at 1024. The shadow map then resolves nothing and the result reads
     * as "shadows are too light" rather than as a resolution problem.
     *
     * Size it to the SUBJECT, not the scene. A few times the largest caster is
     * the useful range; the default suits a ship-scale view. Texel size is
     * roughly `distance / tileSize` in the outermost cascade, so halving this
     * doubles the detail everywhere.
     */
    @meta.float
    carbonShadowDistance = 5000;

    /**
     * Where the first cascade starts, in scene units.
     *
     * Separate from the camera near plane for the same reason as above: a near
     * of 1 against any sensible distance wastes the first cascade or two on a
     * volume nothing occupies. Raise it to the closest distance that actually
     * needs a shadow.
     */
    @meta.float
    carbonShadowNear = 10;

    /** Cascades to build. More range or more detail, at a tile each. */
    @meta.uint
    carbonShadowCascades = 4;

    /** Atlas tile edge in texels. The atlas is this by cascades, so 4x1024 = 4096x1024. */
    @meta.uint
    carbonShadowTileSize = 2048;

    /**
     * Snaps cascades to their own texel grid so shadow edges do not crawl as
     * the camera moves. Carbon has this on by default; turning it off makes
     * the shimmer obvious, which is occasionally useful for diagnosing whether
     * a cascade is being rebuilt every frame.
     */
    @meta.boolean
    carbonShadowStabilize = true;

    /**
     * Colour-codes each cascade instead of writing visibility.
     *
     * This is `ShadowDepth.fx`'s own `SDM_COLOR` permutation, so it costs a
     * shader option rather than an implementation. It is the fastest way to
     * answer "are the cascades where I think they are" - if the bands do not
     * move with the camera, or the whole screen is one colour, the cascade
     * selection is wrong rather than the shadow projection.
     */
    @meta.boolean
    carbonShadowDebug = false;

    /**
     * Sizes the cascade range to the visible objects instead of using
     * `carbonShadowDistance`.
     *
     * On, because the fixed default spends most of its texels on empty space -
     * see the note in {@link GetCarbonShadowRenderer}. Turn it off to drive the
     * range by hand.
     */
    @meta.boolean
    carbonShadowAutoDistance = true;

    @meta.path
    @meta.isPrivate
    envMap1ResPath = "";

    @meta.path
    @meta.isPrivate
    envMap2ResPath = "";

    @meta.path
    @meta.isPrivate
    envMapResPath = "";

    @meta.quaternion
    envMapRotation = quat.create();

    @meta.notImplemented
    @meta.list("Tr2ExternalParameter")
    externalParameters = [];

    @meta.color
    fogColor = vec4.fromValues(0.25, 0.25, 0.25, 1);

    @meta.float
    contrast = 1;

    @meta.float
    nebulaIntensity = 1;

    @meta.list("EveObject")
    objects = [];

    @meta.list("EveObject")
    gizmoObjects = [];

    @meta.path
    @meta.isPrivate
    @meta.todo("Check case on this property")
    postProcessPath = "";

    @meta.struct()
    postprocess = null;

    @meta.color
    sunDiffuseColor = vec4.fromValues(1, 1, 1, 1);

    @meta.vector3
    sunDirection = vec3.fromValues(1, -1, 1);

    @meta.boolean
    display = true;

    @meta.vector3
    @meta.isPrivate
    envMapScaling = vec3.fromValues(1, 1, 1); // Should this come from the background effect?

    @meta.list("EveLensflare")
    lensflares = [];

    @meta.list("EvePlanet")
    planets = [];

    @meta.color
    clearColor = vec4.fromValues(0, 0, 0, 1);

    @meta.notImplemented
    @meta.struct("Tw2Effect")
    shadowEffect = null;

    //  ------------------[ unsupported ]--------------------

    @meta.color
    @meta.noLongerSupported
    ambientColor = vec4.fromValues(0.25, 0.25, 0.25, 1);

    @meta.float
    @meta.noLongerSupported
    fogEnd = 0;

    @meta.float
    @meta.noLongerSupported
    fogMax = 0;

    @meta.float
    @meta.noLongerSupported
    fogStart = 0;

    @meta.uint
    @meta.noLongerSupported
    fogBlur = 0;

    @meta.uint
    @meta.noLongerSupported
    fogType = 0;

    @meta.notImplemented
    @meta.path
    @meta.isPrivate
    lowQualityNebulaMixResPath = "";

    @meta.notImplemented
    @meta.path
    @meta.isPrivate
    lowQualityNebulaResPath = "";

    /**
     * Scales environment reflections. Every shipped nebula authors 1.55.
     * Uploaded as Carbon's SceneData.ReflectionIntensity, which shares a vec4
     * with SceneData.AmbientColor.
     * @type {Number}
     */
    @meta.float
    reflectionIntensity = 1;

    @meta.notImplemented
    @meta.boolean
    selfShadowOnly = false;

    @meta.notImplemented
    @meta.float
    @meta.todo("Identify ps/vs frame data")
    shadowFadeThreshold = 0;

    @meta.notImplemented
    @meta.float
    @meta.todo("Identify ps/vs frame data")
    shadowThreshold = 50000;

    @meta.notImplemented
    @meta.struct("Tr2ShLightingManager")
    shLightingManager = null;

    @meta.notImplemented
    @meta.struct("EveStarField")
    starfield = null;

    @meta.notImplemented
    @meta.color
    sunDiffuseColorWithDynamicLights = vec4.fromValues(1, 1, 1, 1);

    @meta.notImplemented
    @meta.boolean
    useSunDiffuseColorWithDynamicLights = false;

    //  ------------------[ ccpwgl ]--------------------

    @meta.uint
    depthPrecision = 16;

    /**
     * Tuning for {@link GetAutoNearFar}. `minNear` is the hard floor, `margin`
     * the fractional slack either side of the measured bounds.
     * @type {Object}
     */
    @meta.plain
    autoNearFarOptions = { minNear: 0.1, maxFar: 1e9, margin: 0.05 };

    /**
     * Renders the scene into an HDR target rather than straight to the canvas.
     *
     * Off by default: on its own it changes nothing visible, because the target
     * is resolved back to the canvas immediately. It exists so the composite
     * pass has something with range left in it to work on.
     * @type {Boolean}
     */
    @meta.boolean
    hdr = false;

    /**
     * Runs Carbon's composite pass in place of the plain resolve to the canvas.
     * Requires `hdr`, since against an 8-bit target a tone curve operates on
     * values already clamped to 0..1.
     * @type {Boolean}
     */
    @meta.boolean
    compositeEnabled = false;

    /**
     * The modern post process effect set, as shipped environment templates carry
     * it. Distinct from `postprocess`, which is the legacy stage list.
     * @type {Tw2PostProcess2|null}
     */
    @meta.struct("Tw2PostProcess2")
    postProcess2 = null;

    @meta.boolean
    depthCalculation = false;

    @meta.float
    distortionOffset = 1.28;

    @meta.boolean
    useNebulaAsReflection = true;

    @meta.list("EveCurveLineSet")
    lineSets = [];

    @meta.plain
    visible = {
        backgroundObjects: true,
        backgroundTexture: true,
        clearColor: true,
        customPasses: true,
        debug: false,
        distortion: true,
        distortionPreview: false,
        environment: true,
        environmentReflection: true,
        environmentDiffuse: true,
        environmentBlur: true,
        fog: true,
        gizmoObjects: true,
        lensflares: true,
        lineSets: true,
        objects: true,
        planets: true,
        post: true,
        shadow: true,
        ao: true,

        // The Carbon `DepthMap` prepass (EveSpaceSceneDepthHandler). Distinct
        // from `depthCalculation`, which drives the legacy 16-bit RenderDepth
        // pass for distortion and publishes the unread `EveSpaceSceneDepthMap`.
        //
        // It collects every visible object's `Main` technique through the
        // shared depth context, ahead of the colour pass. God rays need it, and
        // AO shares it instead of running its own equivalent prepass.
        //
        // It was briefly suspected of causing a `Tw2Vector4Parameter.Apply`
        // constant-buffer overflow on an instanced hull (angde1_t1:crisis_angel)
        // on 2026-08-13, and defaulted off. That attribution did not survive:
        // the evidence was two single reloads, one of which turned out to be a
        // cached bundle. Left ON, which is what it was when the crash was first
        // seen - the crash is not currently reproducing at all, so switching it
        // off would only hide whichever variable actually changed.
        sceneDepth: true,
    };

    /**
     * Default ambient-occlusion post-effect config (swappable).
     * @type {Object}
     */
    static DEFAULT_AO_POST_EFFECT = DEFAULT_AO_POST_EFFECT;

    @meta.color
    selectorColor = vec4.fromValues(0.5, 0.3, 0.0, 1.0);

    @meta.boolean
    normalCalculation = true;

    @meta.path
    backgroundTexturePath = "";

    _backgroundTexture = null;

    _localTransform = mat4.create();
    _accumulator = new Tw2BatchAccumulator();
    _batchContext = null;
    _batchContextReport = null;
    _depthContext = null;
    _emptyTexture = null;
    _frustum = new Tw2Frustum();
    _lodEnabled = false;
    _perFrameSunDirection = vec3.create();
    _hasPerFrameSunDirection = false;

    _perFrameVS = Tw2RawData.from(EveSpaceScene.perFrameData.vs);
    _perFramePS = Tw2RawData.from(EveSpaceScene.perFrameData.ps);


    _envMapRes = null;
    _envMap1Res = null;
    _envMap2Res = null;

    _internalEffect = null;
    _internalRenderTarget = null;
    _sceneTarget = null;
    _postProcessRenderer = null;
    _godRaysRenderer = null;
    _depthAccumulator = null;
    _depthContext = null;
    _depthContextReport = null;
    _depthTexture = null;
    _carbonShadowRenderer = null;
    _carbonShadowError = null;
    _distortionAccumulator = null;
    _distortionContext = null;
    _distortionContextReport = null;
    _distortionPostProcess = null;
    _depthRendered = false;
    _customPasses = [];
    shadowHandler = null;

    @meta.struct("EveSpaceSceneAO")
    aoHandler = null;

    @meta.struct("EveSpaceSceneDepthHandler")
    depthHandler = null;

    // ----------------------------------------------------------------------------[ Shadow ]---------------------- //

    @meta.boolean
    _enableShadowDebugging = false;

    @meta.boolean
    _enableShadowAutoSettings = false;

    @meta.matrix4
    _shadowView = mat4.create();

    @meta.matrix4
    _shadowProjection = mat4.create();

    @meta.matrix4
    _shadowViewProjection = mat4.create();

    @meta.vector4
    _shadowMapSettings = vec4.fromValues(1, 1, 0, 0);

    @meta.struct("Tw2TextureRes")
    _shadowMapRes = null;

    _perFrameShadowVS = Tw2RawData.from(EveSpaceScene.perFrameShadowData.vs);
    _perFrameShadowPS = Tw2RawData.from(EveSpaceScene.perFrameShadowData.ps);

    // ---------------- Shadow Map Settings ------------ //

    @meta.float
    _shadowMapOffsetX = 0;

    @meta.float
    _shadowMapOffsetY = 0;

    @meta.float
    _shadowDepthBias = 0;

    // ---------------- Shadow Camera Settings ----------- //

    @meta.float
    _shadowCameraNear = 1; // <= 0 to enable shadows

    @meta.float
    _shadowCameraFar = 2; // for shadows on use 1

    @meta.float
    _shadowMinimumVisibility = 0.0;

    get objectsByDistance()
    {
        const
            out = [],
            cameraWorldPosition = vec3.alloc(),
            objectWorldPosition = vec3.alloc();

        mat4.getTranslation(cameraWorldPosition, device.viewInverse);

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].GetWorldTranslation(objectWorldPosition);
            const distance = vec3.distance(cameraWorldPosition, objectWorldPosition);
            out.push({ distance, object: this.objects[i] });
        }

        vec3.unalloc(cameraWorldPosition);
        vec3.unalloc(objectWorldPosition);

        return out
            .sort((a, b) => b.distance - a.distance)
            .map(x => x.object);
    }

    /**
     * Alias for postprocess
     * @returns {Tw2PostProcess|Tr2PostProcess}
     */
    get postProcess()
    {
        return this.postprocess;
    }

    /**
     * Alias for postprocess
     * @param @returns {Tw2PostProcess|Tr2PostProcess} obj
     */
    set postProcess(obj)
    {
        this.postprocess = obj;
    }

    /**
     * Constructor
     */
    constructor()
    {
        super();

        Object.defineProperty(this.visible, "environment", {
            get: () => this.backgroundRenderingEnabled,
            set: bool => this.backgroundRenderingEnabled = bool ? 1 : 0,
            enumerable: true
        });

        Object.defineProperty(this.visible, "shadow", {
            get: () => this.enableShadows,
            set: bool => this.enableShadows = bool ? 1 : 0,
            enumerable: true
        });

    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        tw2.SetVariableValue("SelectorColor", this.selectorColor);
        // Todo: Handle changes to post
        // Todo: Handle changes to environment paths
    }

    /**
     * Initializes the space scene
     */
    Initialize()
    {

        Promise.all([
            this.SetEnvMapReflection(this.envMapResPath),
            this.SetEnvMapDiffuse(this.envMap1ResPath),
            this.SetEnvMapBlur(this.envMap2ResPath),
            this.SetPostProcess(this.postProcessPath),
            //this.SetLensflares(this.lensflarePath)
        ]).then();

        // Shift own objects to the background objects array
        // This is to stop wrapped scenes from accidentally purging the scene's own objects
        // during scene rebuilds
        if (this.objects.length)
        {
            for (let i = 0; i < this.objects.length; i++)
            {
                this.backgroundObjects.push(this.objects[i]);
            }
            this.objects.splice(0);
        }

    }

    /**
     * Sets the scene's transform
     * @param {mat4} m
     */
    SetTransform(m)
    {
        mat4.copy(this._localTransform, m);
    }

    /**
     * Gets the scene's transform
     * @param {mat4} out
     */
    GetTransform(out)
    {
        mat4.copy(out, this._localTransform);
    }

    /**
     * Sets the scene's environment transform
     * @param {mat4} m
     */
    SetEnvironmentTransform(m)
    {
        mat4.getRotation(this.envMapRotation, m);
        mat4.getScaling(this.envMapScaling, m);
        // Apply to the effect as well??
    }

    /**
     * Gets the scene's environment transform
     * @param {mat4} out
     */
    GetEnvironmentTransform(out)
    {
        const translation = vec3.set(EveSpaceScene.global.vec3_ZERO, 0, 0, 0);
        mat4.fromRotationTranslationScale(out, this.envMapRotation, translation, this.envMapScaling);
    }

    /**
     * Sets the post-processing path
     * @param {String} path
     * @param {Boolean} [awaitCompleted] waits until the resource is completed loaded
     * @returns {Promise<null|Tw2PostEffect>}
     */
    async SetPostProcess(path = "", awaitCompleted)
    {
        return EveSpaceScene.HandleResource(this, path, "postProcessPath", "postprocess", awaitCompleted);
    }

    /**
     * Sets the environment's reflection map
     * @param {String} path
     * @param {Boolean} [awaitCompleted] waits until the resource is completed loaded
     * @returns {Promise<null|Tw2Resource>}
     */
    async SetEnvMapReflection(path = "", awaitCompleted)
    {
        return EveSpaceScene.HandleResource(this, path, "envMapResPath", "_envMapRes", awaitCompleted);
    }

    /**
     * Sets the environment's diffuse map
     * @param {String} path
     * @param {Boolean} [awaitCompleted] waits until the resource is completed loaded
     * @returns {Promise<null|Tw2Resource>}
     */
    async SetEnvMapDiffuse(path = "", awaitCompleted)
    {
        return EveSpaceScene.HandleResource(this, path, "envMap1ResPath", "_envMap1Res", awaitCompleted);
    }

    /**
     * Sets the environment's blur map (used for fog)
     * @param {String} path
     */
    async SetEnvMapBlur(path = "", awaitCompleted)
    {
        return EveSpaceScene.HandleResource(this, path, "envMap2ResPath", "_envMap2Res", awaitCompleted);
    }

    /**
     * Enables LOD
     * @param {Boolean} enable
     */
    EnableLod(enable)
    {
        this._lodEnabled = enable;
        if (!enable) this.PerChildObject("ResetLod");
    }

    /**
     * Keeps the scene and it's object's resources alive
     */
    KeepAlive()
    {
        const res = this.GetResources();
        this.GetChildResources(res);

        for (let i = 0; i < res.length; i++)
        {
            res[i].KeepAlive();
        }
    }

    /**
     * Gets scene's resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.lensflares.length; i++)
        {
            this.lensflares[i].GetResources(out);
        }

        if (this.backgroundEffect) this.backgroundEffect.GetResources(out);
        if (this.postprocess) this.postprocess.GetResources(out);
        if (this.starfield) this.starfield.GetResources(out);

        if (this._envMapRes && !out.includes(this._envMapRes)) out.push(this._envMapRes);
        if (this._envMap1Res && !out.includes(this._envMap1Res)) out.push(this._envMap1Res);
        if (this._envMap2Res && !out.includes(this._envMap2Res)) out.push(this._envMap2Res);

        return out;
    }

    /**
     * Gets children's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>}
     */
    GetChildResources(out = [])
    {
        this.PerChildObject("GetResources", out);
        return out;
    }

    /**
     * Calls a function on each planet, object and background object if it exists
     * @param {String} funcName
     * @param args
     */
    PerChildObject(funcName, ...args)
    {
        for (let i = 0; i < this.planets.length; i++)
        {
            if (funcName in this.planets[i])
            {
                this.planets[i][funcName](...args);
            }
        }

        for (let i = 0; i < this.backgroundObjects.length; i++)
        {
            if (funcName in this.backgroundObjects[i])
            {
                this.backgroundObjects[i][funcName](...args);
            }
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            if (funcName in this.objects[i])
            {
                this.objects[i][funcName](...args);
            }
        }

        for (let i = 0; i < this.gizmoObjects.length; i++)
        {
            if (funcName in this.gizmoObjects[i])
            {
                this.gizmoObjects[i][funcName](...args);
            }
        }

        for (let i = 0; i < this.lineSets.length; i++)
        {
            if (funcName in this.lineSets[i])
            {
                this.lineSets[i][funcName](...args);
            }
        }
    }

    /**
     * Gets an empty texture
     * @returns {Tw2TextureRes}
     */
    GetEmptyTexture()
    {
        if (!this._emptyTexture)
        {
            this._emptyTexture = tw2.GetResource("res:/texture/global/black.dds");
        }

        return this._emptyTexture;
    }


    /**
     * Per frame update that is called per frame
     * @param {number} dt - delta time
     */
    Update(dt)
    {

        if (this.starField)
        {
            this.starField.Update(dt);
        }

        this.PerChildObject("Update", dt);

        this.UpdateCarbonLights(dt);

        if (this.postprocess)
        {
            this.postprocess.Update(dt, this);
        }
    }

    /**
     * Collects dynamic lights from light-owning children into the Carbon
     * light list (translated DX11 shader path). Additive: legacy v8
     * shaders never read the light-list textures, so this is inert
     * until a Carbon effect samples them. Mirrors Carbon's per-frame
     * pull (EveSpaceScene.cpp:1375-1416): clear -> GetLights on every
     * owner -> resolve/cull -> hand the list to the binder.
     * @param {Number} dt - delta time
     */
    UpdateCarbonLights(dt)
    {
        if (!this._carbonLightCollector)
        {
            this._carbonLightCollector = new Tw2CarbonLightCollector();
        }

        const
            d = device,
            collector = this._carbonLightCollector;

        collector.Reset();
        this.PerChildObject("GetLights", collector, { dt });

        // The list's tile-header layout must track the real viewport —
        // the translated shaders derive their tile count from the
        // screen size in the per-frame constants.
        collector.GetLightList().SetScreenSize(d.viewportWidth || 16, d.viewportHeight || 16);

        // fovY from the projection's [1][1] = 1/tan(fovY/2); frustum
        // planes are omitted until the Tw2Frustum plane convention is
        // verified against the collector's (positive-inside) one.
        const projScaleY = d.projection[5] || 1;
        collector.Resolve({
            viewportHeight: d.viewportHeight || 0,
            fovY: 2 * Math.atan(1 / Math.abs(projScaleY)),
            cameraPosition: d.eyePosition
        });

        Tw2CarbonResourceBinder.Get(d).SetLightList(collector.GetLightList());
    }

    /**
     * Gets batches for rendering
     * @param {number} mode
     * @param {Array.<EveObject>} objectArray
     * @param {Tw2BatchAccumulator} [accumulator=this._accumulator]
     */
    GetRenderBatches(mode, objectArray, accumulator = this._accumulator)
    {
        for (let i = 0; i < objectArray.length; ++i)
        {
            if ("GetBatches" in objectArray[i])
            {
                this.CollectObjectBatches(objectArray[i], mode, accumulator);
            }
        }
    }

    /**
     * Gets or creates the experimental Carbon-shaped batch context
     * @param {Boolean} [create=true]
     * @returns {Tw2RenderBatchContext|null}
     */
    GetBatchContext(create = true)
    {
        if (!this._batchContext && create)
        {
            this._batchContext = new Tw2RenderBatchContext();
            this._batchContext.AddWriter(this.GetBatchContextWriter());
        }
        return this._batchContext;
    }

    /**
     * Gets the active batch context writer for resolve-per-object-data.
     * This keeps the current legacy per-object buffer wiring while moving
     * toward render-reason aware packet lookup.
     * @returns {Object}
     */
    GetBatchContextWriter()
    {
        return {
            name: "sourcePerObjectData",
            CanWrite: (batch) =>
            {
                return !!(batch && !batch.perObjectData && batch.source && typeof batch.source.GetPerObjectData === "function");
            },
            ResolvePerObjectData: (batch, contextData) =>
            {
                const source = batch && batch.source;
                if (!source || typeof source.GetPerObjectData !== "function")
                {
                    return null;
                }

                const context = contextData && typeof contextData === "object" ? contextData : {};
                return source.GetPerObjectData(context.mode || batch.renderMode, context);
            }
        };
    }

    /**
     * Collects an object's batches through either the legacy accumulator or the experimental context
     * @param {*} object
     * @param {Number} mode
     * @param {Tw2BatchAccumulator|Tw2RenderBatchContext} [accumulator=this._accumulator]
     * @returns {Boolean}
     */
    CollectObjectBatches(object, mode, accumulator = this._accumulator)
    {
        if (!object || typeof object.GetBatches !== "function") return false;

        if (accumulator instanceof Tw2RenderBatchContext)
        {
            return accumulator.CollectObjectBatches(object, mode);
        }

        return object.GetBatches(mode, accumulator);
    }

    /**
     * Renders collected batches
     * @param {Tw2BatchAccumulator|Tw2RenderBatchContext} [accumulator=this._accumulator]
     */
    RenderCollectedBatches(accumulator = this._accumulator)
    {
        accumulator.Render();
        if (accumulator instanceof Tw2RenderBatchContext)
        {
            this._batchContextReport = accumulator.GetReport();
        }
    }

    /**
     * Gets the last batch context report
     * @returns {Object|Null}
     */
    GetBatchContextReport()
    {
        return this._batchContextReport;
    }

    /**
     * Renders the background effect
     * @param {Boolean} [force=this.backgroundRenderingEnabled]
     */
    RenderBackgroundEffect(force = this.backgroundRenderingEnabled)
    {
        if (this.backgroundEffect && this.backgroundEffect.IsGood())
        {
            if (force || !this.backgroundEffect._hasRenderedOnce)
            {
                device.SetStandardStates(device.RM_FULLSCREEN);
                device.RenderCameraSpaceQuad(this.backgroundEffect);
                this.backgroundEffect._hasRenderedOnce = true;
            }
            else
            {
                this.backgroundEffect.KeepAlive();
            }
        }
    }

    /**
     * Renders planets
     * @param {Number} dt
     * @param {Tw2BatchAccumulator} [accumulator=this._accumulator]
     */
    RenderPlanets(dt, accumulator = this._accumulator)
    {
        if (!this.planets.length) return;

        const
            g = EveSpaceScene.global,
            tempProj = mat4.copy(g.mat4_0, device.projection),
            newProj = mat4.copy(g.mat4_1, device.projection),
            zn = 10000,
            zf = 1e11;

        newProj[10] = zf / (zn - zf);
        newProj[14] = (zf * zn) / (zn - zf);
        device.SetProjection(newProj, true);
        this.UpdateViewProjectionFrameData();
        device.gl.depthRange(0.9, 1);

        for (let i = 0; i < this.planets.length; ++i)
        {
            if (this.planets[i].UpdateViewDependentData)
            {
                this.planets[i].UpdateViewDependentData(this._localTransform, dt);
                this.CollectObjectBatches(this.planets[i], device.RM_OPAQUE, accumulator);
                this.CollectObjectBatches(this.planets[i], device.RM_DECAL, accumulator);
                this.CollectObjectBatches(this.planets[i], device.RM_TRANSPARENT, accumulator);
                this.CollectObjectBatches(this.planets[i], device.RM_ADDITIVE, accumulator);
            }
        }

        accumulator.Render();
        if (accumulator instanceof Tw2RenderBatchContext)
        {
            accumulator.Clear();
        }
        device.SetProjection(tempProj, true);
        this.UpdateViewProjectionFrameData();
        device.gl.depthRange(0, 0.9);
    }


    /**
     * Adds a custom pass
     * @param {Function} pass
     */
    AddCustomPass(pass)
    {
        if (!this._customPasses.includes(pass))
        {
            this._customPasses.push(pass);
        }
    }

    /**
     * Removes a custom pass
     * @param {Function} pass
     */
    RemoveCustomPass(pass)
    {
        const index = this._customPasses.indexOf(pass);
        if (index !== -1) this._customPasses.splice(index, 1);
    }

    /**
     * Updates children's view dependent data and renders them
     * @param {Number} dt - deltaTime
     */
    Render(dt)
    {
        const
            d = device,
            show = this.visible;

        if (this._lodEnabled)
        {
            this._frustum.Initialize(d.view, d.projection, d.viewportWidth, d.viewInverse, d.viewProjection);
            this.PerChildObject("UpdateLod", this._frustum);
        }

        this._accumulator.Clear();
        const useBatchContext = !!tw2.enableExperimentalBatchContext;
        const mainAccumulator = useBatchContext ? this.GetBatchContext() : this._accumulator;
        if (mainAccumulator !== this._accumulator) mainAccumulator.Clear();

        this.ApplyPerFrameData();

        // Everything from here to EndSceneTarget draws into the HDR target when
        // one is active. The bind has to happen BEFORE the background, not at
        // RenderCollectedBatches: the background texture, the background effect
        // and the planets all draw immediately, so a later bind would strand
        // them on the canvas and composite the ships over an empty sky.
        const sceneTarget = this.BeginSceneTarget();

        if (this.backgroundTexturePath && this.visible.backgroundTexture)
        {
            if (!this._backgroundTexture)
            {
                this._backgroundTexture = new Tw2TextureParameter("BackgroundTexture", this.backgroundTexturePath);
            }
            else if (this._backgroundTexture.resourcePath !== this.backgroundTexturePath)
            {
                this._backgroundTexture.SetValue(this.backgroundTexturePath);
            }

            if (this._backgroundTexture.IsGood())
            {
                tw2.gl.disable(tw2.gl.DEPTH_TEST);
                tw2.device.RenderTexture(this._backgroundTexture.textureRes);
                tw2.gl.clear(tw2.gl.DEPTH_BUFFER_BIT);
                tw2.gl.enable(tw2.gl.DEPTH_TEST);
            }
        }

        this.RenderBackgroundEffect(this.backgroundRenderingEnabled);

        if (show.planets)
        {
            this.RenderPlanets(dt, mainAccumulator);
            this._accumulator.Clear();
        }

        if (show.backgroundObjects)
        {
            for (let i = 0; i < this.backgroundObjects.length; i++)
            {
                if (this.backgroundObjects[i].UpdateViewDependentData)
                {
                    this.backgroundObjects[i].UpdateViewDependentData(this._localTransform, dt);
                }

                this.CollectObjectBatches(this.backgroundObjects[i], d.RM_OPAQUE, mainAccumulator);
                this.CollectObjectBatches(this.backgroundObjects[i], d.RM_DECAL, mainAccumulator);
                this.CollectObjectBatches(this.backgroundObjects[i], d.RM_TRANSPARENT, mainAccumulator);
                this.CollectObjectBatches(this.backgroundObjects[i], d.RM_ADDITIVE, mainAccumulator);

                if (show.distortionPreview)
                {
                    this.CollectObjectBatches(this.backgroundObjects[i], d.RM_DISTORTION, mainAccumulator);
                }
            }
        }

        if (show.objects)
        {

            for (let i = 0; i < this.objects.length; i++)
            {
                if (this.objects[i].UpdateViewDependentData)
                {
                    this.objects[i].UpdateViewDependentData(this._localTransform, dt);
                }
            }

            const objects = this.objectsByDistance;
            for (let i = 0; i < objects.length; ++i)
            {
                if (show.customPasses)
                {
                    for (let x = 0; x < this._customPasses.length; x++)
                    {
                        this._customPasses[x](dt, this, objects[i]);
                    }
                }

                this.CollectObjectBatches(objects[i], d.RM_OPAQUE, mainAccumulator);
                this.CollectObjectBatches(objects[i], d.RM_DECAL, mainAccumulator);
                this.CollectObjectBatches(objects[i], d.RM_TRANSPARENT, mainAccumulator);
                this.CollectObjectBatches(objects[i], d.RM_ADDITIVE, mainAccumulator);

                if (show.distortionPreview)
                {
                    this.CollectObjectBatches(objects[i], d.RM_DISTORTION, mainAccumulator);
                }
            }
        }

        if (show.lineSets)
        {
            for (let i = 0; i < this.lineSets.length; i++)
            {
                this.lineSets[i].UpdateViewDependentData(this._localTransform, dt);
                this.CollectObjectBatches(this.lineSets[i], d.RM_TRANSPARENT, mainAccumulator);
                this.CollectObjectBatches(this.lineSets[i], d.RM_ADDITIVE, mainAccumulator);
            }
        }

        if (show.planets)
        {
            for (let i = 0; i < this.planets.length; ++i)
            {
                this.planets[i].GetZOnlyBatches(d.RM_OPAQUE, mainAccumulator);
            }
        }

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].PrepareRender(this.sunDirection);
                this.CollectObjectBatches(this.lensflares[i], d.RM_ADDITIVE, mainAccumulator);
            }
        }

        if (show.gizmoObjects)
        {
            for (let i = 0; i < this.gizmoObjects.length; i++)
            {
                if (this.gizmoObjects[i].UpdateViewDependentData)
                {
                    this.gizmoObjects[i].UpdateViewDependentData(this._localTransform, dt);
                }

                this.CollectObjectBatches(this.gizmoObjects[i], d.RM_OPAQUE, mainAccumulator);
                this.CollectObjectBatches(this.gizmoObjects[i], d.RM_DECAL, mainAccumulator);
                this.CollectObjectBatches(this.gizmoObjects[i], d.RM_TRANSPARENT, mainAccumulator);
                this.CollectObjectBatches(this.gizmoObjects[i], d.RM_ADDITIVE, mainAccumulator);
            }
        }

        const shadowHandler = this.GetShadowHandler(false);
        if (shadowHandler && show.shadow)
        {
            shadowHandler.RenderShadowPass(dt, this);
        }

        // Carbon scene depth (`DepthMap`), before every consumer of it below:
        // the shadow resolve unprojects it, AO shares its prepass, and the god
        // ray and fog post passes march and blend by it.
        //
        // ORDERING, deliberately: ccpwgl's own `RenderDepth` runs AFTER the
        // colour pass, because distortion is its only consumer and distortion
        // wants the drawn frame. That pass stays where it is. This one is a
        // separate 32-bit target rendered here, rather than a forced early
        // `RenderDepth(dt, true)`, because forcing the shared pass early also
        // changes what distortion sees - a side effect, not a decision.
        //
        // On by default, and in the default configuration that costs nothing:
        // AO was already running an equivalent prepass every frame and now reads
        // this one instead. With AO off it is one extra scene pass, which is the
        // price of the 96 shaders that sample `DepthMap` getting a real value.
        const depthHandler = this.GetDepthHandler();
        if (depthHandler)
        {
            if (show.sceneDepth)
            {
                try
                {
                    depthHandler.Render(dt, this);
                }
                catch (err)
                {
                    this.visible.sceneDepth = false;
                    depthHandler.ResetOutput();
                    if (tw2.Warning) tw2.Warning({ name: "Scene depth", description: String(err && err.message || err) });
                }
            }
            else
            {
                // No depth this frame: put `DepthMap` back to white, so
                // consumers read "nothing in front" rather than a stale frame.
                depthHandler.ResetOutput();
            }
        }

        // Carbon cascaded sun shadows, before the main colour pass samples the
        // visibility buffer they produce. Self-disables on error for the same
        // reason the AO prepass below does.
        if (this.carbonShadows && show.shadow)
        {
            try
            {
                this.GetCarbonShadowRenderer().Render(dt, this);
            }
            catch (err)
            {
                this.carbonShadows = false;

                // Kept for inspection: self-disabling on the first throw means
                // the console line is the ONLY record, and "carbonShadows keeps
                // turning itself off" is otherwise indistinguishable from a pass
                // that renders nothing. Read `scene.GetCarbonShadowError()`.
                this._carbonShadowError = err;
                console.error("[carbon shadows] disabled by:", err);
                if (tw2.Warning) tw2.Warning({ name: "Carbon shadows", description: String(err && err.message || err) });
            }
        }

        // Ambient occlusion prepass (produces SSAOMap) before the main colour
        // pass samples it. Self-disables on error so a broken AO can't take the
        // whole scene render down.
        const aoHandler = this.GetAOHandler();
        if (aoHandler)
        {
            if (show.ao)
            {
                try
                {
                    aoHandler.Render(dt, this);
                }
                catch (err)
                {
                    this.visible.ao = false;
                    aoHandler.ResetOutput();
                    if (tw2.Warning) tw2.Warning({ name: "SSAO", description: String(err && err.message || err) });
                }
            }
            else
            {
                // AO off: restore SSAOMap to white so the hull stops sampling
                // the last (stale) AO frame.
                aoHandler.ResetOutput();
            }
        }

        this.RenderCollectedBatches(mainAccumulator);

        // Resolve before the lensflare, post process, depth and distortion steps
        // below, all of which expect to find the drawn scene on the canvas.
        // God rays go over the scene image BEFORE the composite, matching
        // Carbon's order - it applies them to `nonMsaaSource` and tone maps the
        // result. They read the `DepthMap` prepass, so they are one of the three
        // features that were blocked on it existing.
        //
        // Called HERE rather than inside EndSceneTarget, which returns early
        // when there is no HDR target - that placement silently disabled god
        // rays for every default (`hdr=0`) session. `sceneTarget` may be null,
        // and the pass then blits additively onto the canvas, which is the same
        // thing Carbon does to its own scene image.
        this.RenderGodRays(sceneTarget);

        this.EndSceneTarget(sceneTarget);

        if (this.starfield)
        {
            // TODO: Implement starfield
        }

        if (this.shadowEffect)
        {
            // TODO: Implement shadow effect
        }

        /*
        if (this.visible.customPasses)
        {
            this.RenderCustomPasses(dt);
        }

         */

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].UpdateOccluders(); // World transform applied here?
            }
        }

        if (this.postprocess)
        {
            this.postprocess.Render(dt);
        }

        this.RenderDepth(dt);
        this.RenderDistortion(dt);
        if (shadowHandler)
        {
            shadowHandler.RenderDebug();
        }

        // After the colour pass, not inside the resolve - the resolve runs
        // before the scene draws, so a blit there is painted over by the ship.
        if (this._carbonShadowRenderer)
        {
            this._carbonShadowRenderer.RenderDebug();
        }

    }

    /**
     * Gets or creates the scene shadow handler.
     * @param {Boolean} [create=true]
     * @returns {EveSpaceSceneShadowHandler|null}
     */
    GetShadowHandler(create = true)
    {
        if (!tw2.enableExperimentalShadows)
        {
            return null;
        }

        if (!this.shadowHandler && create)
        {
            this.shadowHandler = new EveSpaceSceneShadowHandler(this);
        }

        if (this.shadowHandler)
        {
            this.shadowHandler.scene = this;
        }

        return this.shadowHandler;
    }

    /**
     * Gets or creates the scene ambient occlusion handler.
     * @param {Boolean} [create=true]
     * @returns {EveSpaceSceneAO|null}
     */
    /**
     * Gets the Carbon shadow renderer, creating and installing it on first use.
     *
     * Installing puts the per-frame producer on the device's Carbon binder,
     * which is what makes the cascade registers reach the shader. Without it
     * the resolve reads zeros and writes "fully lit" everywhere - a complete
     * pipeline rendering nothing.
     *
     * The scene's `carbonShadow*` properties are the authority, copied onto the
     * producer each call so UI edits take effect without a rebuild.
     * @returns {Tw2CarbonShadowRenderer}
     */
    GetCarbonShadowRenderer()
    {
        if (!this._carbonShadowRenderer)
        {
            this._carbonShadowRenderer = new Tw2CarbonShadowRenderer();
            this._carbonShadowRenderer.Install();
        }

        const
            renderer = this._carbonShadowRenderer,
            producer = renderer.producer;

        renderer.enabled = this.carbonShadows;
        renderer.tileSize = this.carbonShadowTileSize;
        renderer.debug = this.carbonShadowDebug;

        // Fit the cascades to the SUBJECT, not to the camera frustum.
        //
        // Carbon sizes cascades from the camera's own frustum slices, which is
        // right for a game that draws a whole system. Here the camera sees one
        // ship against empty space, and a frustum-sized cascade spends almost
        // all its texels on nothing: at 300m with four cascades the containing
        // slice spans ~834m, so a hull feature lands on well under a metre of
        // texel and the self-shadowing that IS the visible effect in space
        // disappears into the grid.
        //
        // There is no ground in space. A ship's shadow only ever falls on
        // itself or on another object, so "shadows are invisible unless you are
        // next to the hull" is a resolution problem, not a missing shadow -
        // sizing the range to what is actually there is what fixes it.
        if (this.carbonShadowAutoDistance)
        {
            const bounds = this.GetAutoNearFar({ minNear: 1, margin: 0.25 });
            if (bounds) producer.shadowDistance = Math.max(bounds.far, this.carbonShadowNear * 8);
        }
        else
        {
            producer.shadowDistance = this.carbonShadowDistance;
        }

        producer.enabled = this.carbonShadows;
        producer.cascadeCount = this.carbonShadowCascades;
        producer.cellsX = this.carbonShadowCascades;
        producer.cellsY = 1;
        producer.tileSize = this.carbonShadowTileSize;
        // shadowDistance is set above - auto-fitted or from carbonShadowDistance.
        producer.shadowNear = this.carbonShadowNear;
        producer.disableShimmer = this.carbonShadowStabilize;

        return renderer;
    }

    GetAOHandler(create = true)
    {
        if (!this.aoHandler && create)
        {
            this.aoHandler = new EveSpaceSceneAO(this, EveSpaceScene.DEFAULT_AO_POST_EFFECT);
        }

        if (this.aoHandler)
        {
            this.aoHandler.scene = this;
        }

        return this.aoHandler || null;
    }

    /**
     * Measures near/far planes that enclose the visible scene objects.
     *
     * Exposed for a camera to pull from rather than pushed onto one: the scene
     * knows what is visible, the camera owns the projection, and nothing here
     * changes unless a camera opts in. Planets and the background are excluded
     * on purpose - see {@link ComputeAutoNearFar}.
     * @param {Object} [options] - forwarded to ComputeAutoNearFar
     * @returns {{near:Number, far:Number}|null} null when nothing is measurable
     */
    GetAutoNearFar(options)
    {
        const cameraPosition = vec3.alloc();
        mat4.getTranslation(cameraPosition, device.viewInverse);

        const objects = this.visible.objects ? this.objects : [];
        const result = ComputeAutoNearFar(objects, cameraPosition, options || this.autoNearFarOptions);

        vec3.unalloc(cameraPosition);
        return result;
    }

    /**
     * Applies {@link GetAutoNearFar} to a camera.
     *
     * Duck-typed on `nearPlane`/`farPlane` rather than on a camera class: every
     * camera here exposes those two, they mean the same thing in all of them,
     * and requiring a base class would mean editing each one to gain nothing.
     *
     * Call it before the camera's projection is read for the frame. Returns the
     * planes it applied, or null if it had nothing to measure or the camera does
     * not carry them - in which case the camera keeps whatever it had.
     * @param {*} camera
     * @param {Object} [options]
     * @returns {{near:Number, far:Number}|null}
     */
    ApplyAutoNearFar(camera, options)
    {
        if (!camera || !Number.isFinite(camera.nearPlane) || !Number.isFinite(camera.farPlane))
        {
            return null;
        }

        const result = this.GetAutoNearFar(options);
        if (!result) return null;

        camera.nearPlane = result.near;
        camera.farPlane = result.far;
        return result;
    }

    /**
     * Gets or creates the Carbon scene-depth handler, which produces the
     * `DepthMap` global that shadows, god rays and fog all read.
     * @param {Boolean} [create=true]
     * @returns {EveSpaceSceneDepthHandler|null}
     */
    GetDepthHandler(create = true)
    {
        if (!this.depthHandler && create)
        {
            this.depthHandler = new EveSpaceSceneDepthHandler(this);
        }

        if (this.depthHandler)
        {
            this.depthHandler.scene = this;
        }

        return this.depthHandler || null;
    }

    /**
     * Begins drawing the scene into an HDR render target
     *
     * Returns null when the scene should draw straight to the canvas, which is
     * both the default and the fallback. An HDR target is what exposure, bloom
     * and a tone curve need in order to have anything to work on; against the
     * 8-bit canvas they operate on values already clamped to 0..1.
     *
     * Rendering INTO a float texture is an extension even on WebGL2 — sampling
     * one is core — so this is capability-gated. Note that is not the same as a
     * silent format fallback: the feature is either available or absent, and an
     * absent one leaves today's behaviour exactly intact rather than producing a
     * differently-wrong image.
     *
     * @returns {Tw2RenderTarget|null}
     */
    BeginSceneTarget()
    {
        if (!this.hdr || !device.canRenderToHalfFloat) return null;

        const { width, height } = tw2;
        if (!width || !height) return null;

        if (!this._sceneTarget)
        {
            this._sceneTarget = new Tw2RenderTarget("EveSpaceSceneHDR", width, height, true, "rgba16f");
        }
        else
        {
            this._sceneTarget.Update(width, height, true, "rgba16f");
        }

        if (!this._sceneTarget.IsGood()) return null;

        this._sceneTarget.Set();
        tw2.ClearBufferBits(true, true, true);
        return this._sceneTarget;
    }

    /**
     * Finishes the HDR target and puts the result on the canvas
     *
     * Everything after the main pass — lensflares, the legacy post process,
     * depth and distortion — expects the drawn scene to be on the canvas, so the
     * resolve happens here rather than at the end of the frame. That also means
     * the HDR range does not survive past this point today; the composite pass
     * will consume the target directly and replace this blit.
     *
     * @param {Tw2RenderTarget|null} sceneTarget
     */
    EndSceneTarget(sceneTarget)
    {
        if (!sceneTarget) return;

        sceneTarget.Unset();

        // Carbon runs the composite even with no post process object at all, so
        // presence of `postProcess2` is not the gate - having a working composite
        // effect is. The plain blit is the fallback for the frames before the
        // effect has loaded, and for a device that cannot compile it.
        if (this.compositeEnabled)
        {
            if (!this._postProcessRenderer) this._postProcessRenderer = new Tw2PostProcessRenderer();
            if (this._postProcessRenderer.Render(sceneTarget, this.postProcess2)) return;
        }

        const { gl } = tw2;
        gl.disable(gl.DEPTH_TEST);
        device.RenderTexture(sceneTarget.texture);
        gl.enable(gl.DEPTH_TEST);
    }

    /**
     * Renders god rays over the scene image.
     *
     * Self-disables on error, like the shadow and AO passes: a post effect
     * should not be able to take the whole scene render down.
     * @param {Tw2RenderTarget|null} sceneTarget - null draws into the canvas
     * @returns {Boolean}
     */
    RenderGodRays(sceneTarget)
    {
        if (!this.visible.post || !this.postProcess2) return false;

        const godRays = this.postProcess2.GetIfAvailable("godRays");
        if (!godRays) return false;

        if (!this._godRaysRenderer) this._godRaysRenderer = new Tw2GodRaysRenderer();

        // The Carbon prepass, not the legacy 16-bit one - god rays march the
        // depth and compare distances, which is exactly what 16 bits cannot do
        // at EVE's far plane.
        const depthHandler = this.GetDepthHandler(false);
        const depth = depthHandler && depthHandler.rendered ? depthHandler.depthTextureRes : null;

        try
        {
            return this._godRaysRenderer.Render(godRays, depth, sceneTarget);
        }
        catch (err)
        {
            this.visible.post = false;
            if (tw2.Warning) tw2.Warning({ name: "God rays", description: String(err && err.message || err) });
            return false;
        }
    }

    /**
     * The error that disabled `carbonShadows`, if one did.
     * @returns {?Error}
     */
    GetCarbonShadowError()
    {
        return this._carbonShadowError || null;
    }

    /**
     * The world-space sphere the shadow cascade should be fitted to.
     *
     * Carbon fits cascades to camera frustum slices, which suits a client
     * drawing a whole system. A ship viewer shows one object in empty space, and
     * there the only shadow that can be SEEN is the object shadowing itself -
     * there is no ground to catch anything else. Fitting the cascade to the
     * object rather than to the frustum makes texel density depend on the ship's
     * size instead of on how far the camera is standing back.
     * @returns {?{center: vec3, radius: Number, far: Number}}
     */
    GetShadowSubject()
    {
        const objects = this.visible.objects ? this.objects : [];
        if (!objects.length) return null;

        const bounds = GetSceneBoundingSphere(objects);
        if (!bounds) return null;

        const cameraPosition = vec3.alloc();
        mat4.getTranslation(cameraPosition, device.viewInverse);
        const distance = vec3.distance(cameraPosition, bounds.center);
        vec3.unalloc(cameraPosition);

        // `far` is the split value, compared against a fragment's view distance.
        // It must clear the subject by a margin, for two reasons: fragments past
        // the last split read as lit, and the resolve ramps the FINAL 5% of the
        // shadow distance to lit so cascades do not end on a hard line. With
        // subject fitting there is only one cascade, so every fragment is in the
        // last one and that fade is always live - a `far` that merely reaches
        // the object puts its far side inside the ramp and washes the shadows
        // out. Dividing by 0.9 leaves the whole subject clear of the band.
        return {
            center: bounds.center,
            radius: bounds.radius,
            far: (distance + bounds.radius) / 0.9
        };
    }

    /**
     * Gets the last god ray report, for the debug overlay.
     * @returns {?Object}
     */
    GetGodRaysReport()
    {
        return this._godRaysRenderer ? this._godRaysRenderer.GetReport() : null;
    }

    /**
     * Gets or creates the shared internal depth/distortion render target
     * @returns {Tw2DepthRenderTarget}
     */
    EnsureInternalRenderTarget()
    {
        if (!this._internalRenderTarget)
        {
            if (!tw2.HasVariable("EveSpaceSceneDepthMap")) tw2.SetVariable("EveSpaceSceneDepthMap", "");
            const DepthTexture = tw2.GetVariable("EveSpaceSceneDepthMap");
            this._internalRenderTarget = new Tw2DepthRenderTarget("InternalPasses", tw2.width, tw2.height, this.depthPrecision, DepthTexture);
        }
        else
        {
            this._internalRenderTarget.Create(tw2.width, tw2.height, this.depthPrecision);
        }

        return this._internalRenderTarget;
    }

    /**
     * Renders depth
     * @param {Number} dt
     * @param {Boolean} [force]
     * @returns {boolean} true if completed
     */
    RenderDepth(dt, force)
    {
        if (tw2.enableExperimentalBatchContext)
        {
            return this.RenderDepthWithBatchContext(dt, force);
        }

        if (!force && !this.depthCalculation || this._depthRendered)
        {
            return false;
        }

        const useBatchContext = !!tw2.enableExperimentalBatchContext;

        const depthContext = useBatchContext ? this.GetDepthContext() : null;

        if (!useBatchContext)
        {
            if (!this._depthAccumulator)
            {
                this._depthAccumulator = new Tw2BatchAccumulator2();
            }
            else
            {
                this._depthAccumulator.Clear();
            }
        }

        if (depthContext)
        {
            depthContext.Clear();
        }

        if (!this._internalRenderTarget)
        {
            if (!tw2.HasVariable("EveSpaceSceneDepthMap")) tw2.SetVariable("EveSpaceSceneDepthMap", "");
            const DepthTexture = tw2.GetVariable("EveSpaceSceneDepthMap");
            this._internalRenderTarget = new Tw2DepthRenderTarget("InternalPasses", tw2.width, tw2.height, this.depthPrecision, DepthTexture);
        }
        else
        {
            this._internalRenderTarget.Create(tw2.width, tw2.height, this.depthPrecision);
        }

        const { gl } = device;

        // Todo: Include planets
        let depthTexture;

        let objectsOrderedByDistance;

        if (this.normalCalculation)
        {
            if (this.visible.objects)
            {
                if (!objectsOrderedByDistance) objectsOrderedByDistance = this.objectsByDistance;

                if (useBatchContext)
                {
                    depthContext.CollectObjectArrayBatches(objectsOrderedByDistance, RM_OPAQUE, {
                        techniqueFilter: "Normal",
                        techniqueOverride: "Normal"
                    });
                }
                else
                {
                    this._depthAccumulator.GetObjectArrayBatches(objectsOrderedByDistance, RM_OPAQUE, "Normal");
                }
            }

            if (this.visible.backgroundObjects)
            {
                if (useBatchContext)
                {
                    depthContext.CollectObjectArrayBatches(this.backgroundObjects, RM_OPAQUE, {
                        techniqueFilter: "Normal",
                        techniqueOverride: "Normal"
                    });
                }
                else
                {
                    this._depthAccumulator.GetObjectArrayBatches(this.backgroundObjects, RM_OPAQUE, "Normal");
                }
            }

            depthTexture = tw2.GetVariable("EveSpaceSceneNormalMap");
            if (!depthTexture.textureRes)
            {
                const res = new Tw2TextureRes();
                res.suppressLogging = true;
                res.Attach(gl.createTexture());
                depthTexture.AttachTextureRes(res);
            }
        }
        else
        {
            if (this.visible.objects)
            {
                if (!objectsOrderedByDistance) objectsOrderedByDistance = this.objectsByDistance;

                if (useBatchContext)
                {
                    depthContext.CollectObjectArrayBatches(objectsOrderedByDistance, RM_DEPTH, {
                        techniqueFilter: "Main",
                        techniqueOverride: "Main"
                    });
                    depthContext.CollectObjectArrayBatches(objectsOrderedByDistance, RM_OPAQUE, {
                        techniqueFilter: "Depth",
                        techniqueOverride: "Depth"
                    });
                }
                else
                {
                    this._depthAccumulator.GetObjectArrayBatches(objectsOrderedByDistance, RM_DEPTH, "Main");
                    this._depthAccumulator.GetObjectArrayBatches(objectsOrderedByDistance, RM_OPAQUE, "Depth");
                }
            }

            if (this.visible.backgroundObjects)
            {
                if (useBatchContext)
                {
                    // That will teach you! Get ordered by distance...
                    depthContext.CollectObjectArrayBatches(this.backgroundObjects, RM_DEPTH, {
                        techniqueFilter: "Main",
                        techniqueOverride: "Main"
                    });
                    depthContext.CollectObjectArrayBatches(this.backgroundObjects, RM_OPAQUE, {
                        techniqueFilter: "Depth",
                        techniqueOverride: "Depth"
                    });
                }
                else
                {
                    // That will teach you! Get ordered by distance...
                    this._depthAccumulator.GetObjectArrayBatches(this.backgroundObjects, RM_DEPTH, "Main");
                    this._depthAccumulator.GetObjectArrayBatches(this.backgroundObjects, RM_OPAQUE, "Depth");
                }
            }
        }

        this._internalRenderTarget.SetCallUnset(() =>
        {
            tw2.ClearBufferBits(true, true, true);
            if (useBatchContext && depthContext)
            {
                depthContext.Render();
            }
            else
            {
                this._depthAccumulator.Render();
            }
            this._depthRendered = true;

            if (depthTexture)
            {
                // Copy the results to the global depth texture
                gl.bindTexture(gl.TEXTURE_2D, depthTexture.textureRes.texture);
                gl.copyTexImage2D(
                    gl.TEXTURE_2D,
                    0,
                    device.alphaBlendBackBuffer ? gl.RGBA : gl.RGB,
                    0,
                    0,
                    device.viewportWidth,
                    device.viewportHeight,
                    0);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

        });

        return this._depthRendered;
    }

    /**
     * Renders depth through the experimental Carbon-shaped batch context
     * @param {Number} dt
     * @param {Boolean} [force]
     * @returns {boolean} true if completed
     */
    RenderDepthWithBatchContext(dt, force)
    {
        if (!force && !this.depthCalculation || this._depthRendered)
        {
            return false;
        }

        const depthContext = this.GetDepthContext();
        depthContext.Clear();
        this.EnsureInternalRenderTarget();

        const { gl } = device;
        let depthTexture = null;
        let objectsOrderedByDistance = null;

        const collect = (objects, mode, technique) =>
        {
            if (!objects || !objects.length) return;
            depthContext.CollectObjectArrayBatches(objects, mode, {
                techniqueFilter: technique,
                techniqueOverride: technique,
                renderReason: this.normalCalculation ? "NormalPass" : "DepthPass"
            });
        };

        if (this.visible.objects)
        {
            objectsOrderedByDistance = this.objectsByDistance;
        }

        if (this.visible.objects)
        {
            collect(objectsOrderedByDistance, RM_OPAQUE, "Depth");
            collect(objectsOrderedByDistance, RM_DECAL, "Depth");
            collect(objectsOrderedByDistance, RM_DEPTH, "Main");
        }

        if (this.visible.backgroundObjects)
        {
            collect(this.backgroundObjects, RM_OPAQUE, "Depth");
            collect(this.backgroundObjects, RM_DECAL, "Depth");
            collect(this.backgroundObjects, RM_DEPTH, "Main");
        }

        if (this.normalCalculation)
        {
            depthTexture = tw2.GetVariable("EveSpaceSceneNormalMap");
            if (!depthTexture.textureRes)
            {
                const res = new Tw2TextureRes();
                res.suppressLogging = true;
                res.Attach(gl.createTexture());
                depthTexture.AttachTextureRes(res);
            }
        }

        const rendered = this._internalRenderTarget.SetCallUnset(() =>
        {
            tw2.ClearBufferBits(true, true, true);
            depthContext.Render();
            this._depthRendered = true;

            if (depthTexture)
            {
                gl.bindTexture(gl.TEXTURE_2D, depthTexture.textureRes.texture);
                gl.copyTexImage2D(
                    gl.TEXTURE_2D,
                    0,
                    device.alphaBlendBackBuffer ? gl.RGBA : gl.RGB,
                    0,
                    0,
                    device.viewportWidth,
                    device.viewportHeight,
                    0);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        });

        this._depthContextReport = {
            path: "experimental",
            ok: rendered,
            normalCalculation: !!this.normalCalculation,
            ...depthContext.GetReport()
        };

        return this._depthRendered;
    }

    /**
     * Gets or creates the experimental depth batch context
     * @param {Boolean} [create=true]
     * @returns {Tw2RenderBatchContext|null}
     */
    GetDepthContext(create = true)
    {
        if (create && !this._depthContext)
        {
            this._depthContext = new Tw2RenderBatchContext();
            this._depthContext.AddWriter(this.GetBatchContextWriter());
        }
        return this._depthContext;
    }

    /**
     * Gets the last experimental depth batch context report
     * @returns {?Object}
     */
    GetDepthContextReport()
    {
        return this._depthContextReport;
    }

    /**
     * Renders distortion
     * @param {Number} dt
     * @returns {boolean} true if completed
     */
    RenderDistortion(dt)
    {
        if (tw2.enableExperimentalBatchContext)
        {
            return this.RenderDistortionWithBatchContext(dt);
        }

        if (!this.visible.distortion) return false;

        if (!this._distortionEffect || !this._distortionPostProcess || !this._internalRenderTarget)
        {
            if (!this._internalRenderTarget)
            {
                if (!tw2.HasVariable("EveSpaceSceneDepthMap")) tw2.SetVariable("EveSpaceSceneDepthMap", "");
                const DepthTexture = tw2.GetVariable("EveSpaceSceneDepthMap");
                this._internalRenderTarget = new Tw2DepthRenderTarget("InternalPasses", tw2.width, tw2.height, this.depthPrecision, DepthTexture);
            }

            this._distortionEffect = this._distortionEffect || Tw2Effect.from({
                name: "Distortion",
                effectFilePath: "res:/graphics/effect.gles2/managed/space/postprocess/distortion.fx",
                parameters: {
                    MAX_DISTORTION_OFFSET: [ this.distortionOffset, 0, 0, 0 ]
                },
                textures: {
                    TexDistortion: ""
                }
            });

            this._distortionEffect.parameters.TexDistortion.AttachTextureRes(this._internalRenderTarget.texture);
            this._distortionPostProcess = this._distortionPostProcess || new Tw2PostProcess("Distortion");
            this._distortionPostProcess.stages[0] = this._distortionEffect;
        }

        if (!this._distortionEffect.IsGood())
        {
            return false;
        }

        this._distortionEffect.parameters.MAX_DISTORTION_OFFSET.x = this.distortionOffset;

        const useBatchContext = !!tw2.enableExperimentalBatchContext;
        const distortionContext = useBatchContext ? this.GetDistortionContext() : null;

        if (distortionContext)
        {
            distortionContext.Clear();
        }
        else
        {
            if (!this._distortionAccumulator)
            {
                this._distortionAccumulator = new Tw2BatchAccumulator2();
            }
            else
            {
                this._distortionAccumulator.Clear();
            }
        }

        if (this.visible.objects)
        {
            if (useBatchContext)
            {
                distortionContext.CollectObjectArrayBatches(this.objectsByDistance, RM_DISTORTION, {
                    techniqueFilter: "Main",
                    techniqueOverride: "Main"
                });
            }
            else
            {
                this._distortionAccumulator.GetObjectArrayBatches(this.objectsByDistance, RM_DISTORTION, "Main");
            }
        }

        if (this.visible.backgroundObjects)
        {
            if (useBatchContext)
            {
                distortionContext.CollectObjectArrayBatches(this.backgroundObjects, RM_DISTORTION, {
                    techniqueFilter: "Main",
                    techniqueOverride: "Main"
                });
            }
            else
            {
                this._distortionAccumulator.GetObjectArrayBatches(this.backgroundObjects, RM_DISTORTION, "Main");
            }
        }

        const hasDistortionBatches = useBatchContext
            ? distortionContext.length > 0
            : this._distortionAccumulator.length > 0;

        if (!hasDistortionBatches)
        {
            return true;
        }

        if (!this._depthRendered)
        {
            this.RenderDepth(dt, true);
        }

        this._internalRenderTarget.SetCallUnset(() =>
        {
            tw2.ClearBufferBits(true, false, true);
            if (useBatchContext)
            {
                distortionContext.Render();
            }
            else
            {
                this._distortionAccumulator.Render();
            }
        });

        this._distortionPostProcess.Render(dt);
    }

    /**
     * Prepares the distortion post process resources
     * @returns {Boolean}
     */
    PrepareDistortionPass()
    {
        if (!this._internalRenderTarget)
        {
            this.EnsureInternalRenderTarget();
        }

        this._distortionEffect = this._distortionEffect || Tw2Effect.from({
            name: "Distortion",
            effectFilePath: "res:/graphics/effect.gles2/managed/space/postprocess/distortion.fx",
            parameters: {
                MAX_DISTORTION_OFFSET: [ this.distortionOffset, 0, 0, 0 ]
            },
            textures: {
                TexDistortion: ""
            }
        });

        this._distortionEffect.parameters.TexDistortion.AttachTextureRes(this._internalRenderTarget.texture);
        this._distortionPostProcess = this._distortionPostProcess || new Tw2PostProcess("Distortion");
        this._distortionPostProcess.stages[0] = this._distortionEffect;

        if (!this._distortionEffect.IsGood())
        {
            return false;
        }

        this._distortionEffect.parameters.MAX_DISTORTION_OFFSET.x = this.distortionOffset;
        return true;
    }

    /**
     * Renders distortion through the experimental Carbon-shaped batch context
     * @param {Number} dt
     * @returns {boolean} true if completed
     */
    RenderDistortionWithBatchContext(dt)
    {
        if (!this.visible.distortion) return false;

        const distortionContext = this.GetDistortionContext();
        distortionContext.Clear();

        const options = {
            techniqueFilter: "Main",
            techniqueOverride: "Main",
            renderReason: "DistortionPass"
        };

        if (this.visible.objects)
        {
            distortionContext.CollectObjectArrayBatches(this.objectsByDistance, RM_DISTORTION, options);
        }

        if (this.visible.backgroundObjects)
        {
            distortionContext.CollectObjectArrayBatches(this.backgroundObjects, RM_DISTORTION, options);
        }

        const hasDistortionBatches = distortionContext.length > 0;
        if (!hasDistortionBatches)
        {
            this._distortionContextReport = {
                path: "experimental",
                ok: true,
                empty: true,
                ...distortionContext.GetReport()
            };
            return true;
        }

        if (!this._depthRendered)
        {
            this.RenderDepth(dt, true);
        }

        if (!this.PrepareDistortionPass())
        {
            this._distortionContextReport = {
                path: "experimental",
                ok: false,
                empty: false,
                ...distortionContext.GetReport()
            };
            return false;
        }

        const rendered = this._internalRenderTarget.SetCallUnset(() =>
        {
            tw2.ClearBufferBits(true, false, true);
            distortionContext.Render();
        });

        this._distortionContextReport = {
            path: "experimental",
            ok: rendered,
            empty: false,
            ...distortionContext.GetReport()
        };

        this._distortionPostProcess.Render(dt);
        return true;
    }

    /**
     * Gets or creates the experimental distortion batch context
     * @param {Boolean} [create=true]
     * @returns {Tw2RenderBatchContext|null}
     */
    GetDistortionContext(create = true)
    {
        if (create && !this._distortionContext)
        {
            this._distortionContext = new Tw2RenderBatchContext();
            this._distortionContext.AddWriter(this.GetBatchContextWriter());
        }
        return this._distortionContext;
    }

    /**
     * Gets the last experimental distortion batch context report
     * @returns {?Object}
     */
    GetDistortionContextReport()
    {
        return this._distortionContextReport;
    }

    /**
     * Get normalized sun direction
     * @param {vec3} out
     */
    GetPerFrameSunDirection(out)
    {
        const lenSq = vec3.squaredLength(this.sunDirection);

        if (Number.isFinite(lenSq) && lenSq > 1e-8)
        {
            vec3.copy(out, this.sunDirection);
            vec3.negate(out, out);
            vec3.normalize(out, out);
            vec3.copy(this._perFrameSunDirection, out);
            this._hasPerFrameSunDirection = true;
            return out;
        }

        if (this._hasPerFrameSunDirection)
        {
            return vec3.copy(out, this._perFrameSunDirection);
        }

        vec3.set(out, -1, 1, -1);
        vec3.normalize(out, out);
        vec3.copy(this._perFrameSunDirection, out);
        this._hasPerFrameSunDirection = true;
        return out;
    }

    /**
     * Applies view projection frame data
     */
    UpdateViewProjectionFrameData()
    {
        device.UpdateViewProjection();

        const
            d = device,
            vs = this._perFrameVS,
            ps = this._perFramePS;

        d.perFrameVSData = vs;
        d.perFramePSData = ps;


        const sunDir = this.GetPerFrameSunDirection(EveSpaceScene.global.vec3_0);

        vs.Set("SunData.DirWorld", [ sunDir[0], sunDir[1], sunDir[2], 0 ]);
        vs.Set("TargetResolution", d.targetResolution);
        vs.Set("ViewInverseTransposeMat", d.viewInverse);
        vs.Set("ViewProjectionMat", d.viewProjectionTranspose);
        vs.Set("ViewMat", d.viewTranspose);
        vs.Set("ProjectionMat", d.projectionTranspose);

        ps.Set("SunData.DirWorld", [ sunDir[0], sunDir[1], sunDir[2], 0 ]);
        ps.Set("TargetResolution", d.targetResolution);
        ps.Set("FovXY", [ d.targetResolution[3], d.targetResolution[2] ]);
        ps.Set("ViewInverseTransposeMat", d.viewInverse);
        ps.Set("ViewMat", d.viewTranspose);
        ps.SetIndex("ProjectionToView", 0, -d.projection[14]);
        ps.SetIndex("ProjectionToView", 1, -d.projection[10] - 1);

        this.UpdateShadow();
    }

    UpdateShadow()
    {
        const handler = this.GetShadowHandler();
        if (handler)
        {
            return handler.ApplyPerFrameData(this);
        }

        if (this.enableShadows || !tw2.enableExperimentalShadows)
        {
            device.perFrameShadowPSData = this._perFrameShadowPS;
            device.perFrameShadowVSData = this._perFrameShadowVS;
            this.UpdateShadowMatrices();

            const shadowViewTranspose = mat4.transpose(EveSpaceScene.global.mat4_0, this._shadowView);
            const shadowViewProjectionTranspose = mat4.transpose(EveSpaceScene.global.mat4_1, this._shadowViewProjection);

            // Shadow matrices go in the dedicated shadow container only. GLES
            // does not use shadows, so writing them into the GLES per-frame VS
            // fed slots nothing reads - and on the dx11 path it fed them
            // through Tw2CarbonData's wholesale copy of VS regs 0-27, which
            // lands them in Carbon's ShadowViewMat/ShadowViewProjectionMat as a
            // side effect of a transcode rather than as authored Carbon values.
            // Carbon's shadow registers are authored directly instead.
            this._perFrameShadowVS.Set("ShadowView", shadowViewTranspose);
            this._perFrameShadowVS.Set("ShadowViewProjection", shadowViewProjectionTranspose);
            this._perFrameShadowVS.Set("ShadowNearFar", [ device.nearPlane, device.farPlane || 1, 0, 0 ]);

        }

        // ShadowMapSettings and ShadowCameraRange are NOT written into the GLES
        // per-frame PS. GLES does not use shadows, and the values that were
        // written there were guesses - the auto-settings branch below wrote
        // literal zeros through a `enableShadows ? 0 : 0` conditional, which is
        // its own admission.
        //
        // They are real registers on the Carbon side (PerFramePS 18 and 19,
        // where 19 carries ShadowCameraRange.xy, ShadowLightness and a uint
        // ShadowQuality), so they must be authored from Carbon's meanings by
        // the dx11 producer rather than inherited from these slots through
        // Tw2CarbonData's wholesale copy of regs 0-20.
    }

    /**
     * Updates shadow matrices
     * TODO: Replace the identity fallback with directional shadow fitting.
     */
    UpdateShadowMatrices()
    {
        const handler = this.GetShadowHandler();
        if (handler)
        {
            return handler.UpdateMatrices(this);
        }

        mat4.identity(this._shadowView);
        mat4.identity(this._shadowProjection);
        mat4.identity(this._shadowViewProjection);
    }

    /**
     * Applies per frame data
     */
    ApplyPerFrameData()
    {
        this._depthRendered = false;

        this.UpdateViewProjectionFrameData();

        const
            d = device,
            g = EveSpaceScene.global,
            world = this._localTransform,
            envMapTransform = g.mat4_2,
            show = this.visible;

        // Environment
        mat4.fromQuat(envMapTransform, this.envMapRotation);
        mat4.scale(envMapTransform, envMapTransform, this.envMapScaling);
        mat4.multiply(envMapTransform, envMapTransform, world);
        envMapTransform[12] = 0;
        envMapTransform[13] = 0;
        envMapTransform[14] = 0;
        mat4.transpose(envMapTransform, envMapTransform);

        const
            vs = this._perFrameVS,
            ps = this._perFramePS;

        d.perFrameVSData = vs;
        d.perFramePSData = ps;

        if (this.visible.fog)
        {
            let distance = this.fogEnd - this.fogStart;
            if (Math.abs(distance) < 1e-5) distance = 1e-5;
            const f = 1.0 / distance;

            vs.Set("FogFactors", [ this.fogEnd * f, f, this.fogMax, 1 ]);

            // W IS fogMax, NOT the colour's alpha. Carbon builds this constant
            // as `Vector4( fogColor.rgb, m_fogMax )` (EveSpaceScene.cpp:3093),
            // and the pixel shader reads the w as the fog density:
            // `transmittance = exp(-1e-5 * FogColor.w * viewDistance)`.
            //
            // Passing fogColor whole sent the colour's alpha instead, which
            // defaults to 1 where fogMax defaults to 0 - so scenes that author
            // no fog got dense fog anyway, at EVE's distances. It shows up as
            // ambient occlusion turning the fog colour rather than black,
            // because the quad shader applies AO as
            // `mix(FogColor, lit * AO, transmittance)` - so as AO approaches 0
            // the pixel approaches the fog colour, while true black (no object,
            // no shader) stays black.
            ps.Set("SceneData.FogColor", [ this.fogColor[0], this.fogColor[1], this.fogColor[2], this.fogMax ]);
            ps.Set("MiscSettings", [
                d.currentTime,
                this.fogType,
                this.fogBlur,
                this.contrast
            ]);
        }
        else
        {
            vs.Set("FogFactors", [ 0, 0, 0, 0 ]);
            ps.Set("SceneData.FogColor", [ 0, 0, 0, 0 ]);
            ps.Set("MiscSettings", [ d.currentTime, 0, 0, this.contrast ]);
        }

        vs.Set("ViewportAdjustment", [ 1, 1, 1, 1 ]);
        vs.Set("MiscSettings", [ d.currentTime, 0, d.viewportWidth, d.viewportHeight ]);
        vs.Set("SunData.DiffuseColor", this.sunDiffuseColor);
        vs.Set("EnvMapRotationMat", envMapTransform);

        ps.Set("EnvMapRotationMat", envMapTransform);
        ps.Set("SunData.DiffuseColor", this.sunDiffuseColor);
        ps.Set("SceneData.AmbientColor", this.ambientColor);

        // This slot is Carbon's ReflectionIntensity, not the nebula intensity.
        // Carbon's PerFramePSData packs `Vector3 AmbientColor` immediately
        // followed by `float ReflectionIntensity` into one vec4
        // (EveSpaceScene.h:246-247, filled at EveSpaceScene.cpp:3092), and the
        // shaders read it there. It was previously fed this.nebulaIntensity, so
        // every Carbon-derived shader has been scaling reflections by the wrong
        // authored value - 1.25 instead of 1.55 on every shipped nebula.
        ps.SetIndex("SceneData.ReflectionIntensity", 0, this.reflectionIntensity);

        // The nebula intensity is a global shader VARIABLE in Carbon, not part
        // of the per-frame data (`m_nebulaIntensityVar( "NebulaIntensity", ... )`,
        // EveSpaceScene.cpp:202). The background effect multiplies its output by
        // Tint * NebulaIntensity.
        if (!tw2.HasVariable("NebulaIntensity")) tw2.SetVariable("NebulaIntensity", this.nebulaIntensity);
        else tw2.SetVariableValue("NebulaIntensity", this.nebulaIntensity);
        ps.SetIndex("ViewportSize", 0, d.viewportWidth);
        ps.SetIndex("ViewportSize", 1, d.viewportHeight);

        // The environment maps are bound as raw texture res rather than through
        // texture parameters, so nothing marks them in use and the resource
        // manager eventually purges them. A purged blur cube leaves the diffuse
        // environment term sampling nothing, which reads as hard black patches
        // that rotate with the hull like a reflection - worst on Amarr, whose
        // surfaces are the most reflective. It survives a nebula change, because
        // the replacement is purged in turn.
        //
        // KeepAlive also reloads a resource that is already purged, so this both
        // prevents the fault and recovers from it.
        if (this._envMapRes) this._envMapRes.KeepAlive();
        if (this._envMap1Res) this._envMap1Res.KeepAlive();
        if (this._envMap2Res) this._envMap2Res.KeepAlive();

        let envMap = this.GetEmptyTexture(),
            // These are texture res not texture parameters
            // We may have done something fancy here, rather than being explicit
            // it looks like we've allowed textureRes OR texture parameters
            envMap1 = this._envMap1Res && show.environmentDiffuse ? this._envMap1Res : this.GetEmptyTexture(),
            envMap2 = this._envMap2Res && show.environmentBlur ? this._envMap2Res : this.GetEmptyTexture();

        if (show.environmentReflection)
        {
            if (this.useNebulaAsReflection && this.backgroundEffect && this.backgroundEffect.parameters.NebulaMap)
            {
                envMap = this.backgroundEffect.parameters.NebulaMap.res || this._envMapRes;
            }
            else
            {
                envMap = this._envMapRes;
            }

            // Carbon's hull shaders choose a mip from roughness and sample this
            // cube with an explicit LOD, up to level 7. A single-level cube has
            // no chain to choose from, so every roughness resolves to the
            // sharpest level and rough metal reads as a mirror.
            //
            // The background cube is authored without mips (it is only ever
            // sampled at level 0), so using it as the reflection source - which
            // is what useNebulaAsReflection does - leaves the shader nothing to
            // blur with. CCP ships a prefiltered reflection cube beside it for
            // exactly this purpose; prefer that whenever the chosen source
            // cannot answer a LOD query.
            if (envMap && !envMap._hasMipMaps && this._envMap1Res && this._envMap1Res._hasMipMaps)
            {
                envMap = this._envMap1Res;
            }
        }

        tw2.GetVariable("EveSpaceSceneEnvMap").AttachTextureRes(envMap);
        tw2.GetVariable("EnvMap1").AttachTextureRes(envMap1);
        tw2.GetVariable("EnvMap2").AttachTextureRes(envMap2);
    }

    /**
     * Handles resource paths and loading
     * @param {EveSpaceScene} scene
     * @param {String|Null} path
     * @param {String} pathProperty
     * @param {String} targetObjectProperty
     * @param {Boolean} [awaitCompleted]
     * @returns {Promise<Boolean>} True if the path was set
     */
    static async HandleResource(scene, path, pathProperty, targetObjectProperty, awaitCompleted)
    {
        path = path ? path.toLowerCase() : null;

        // Clear the resource and value
        if (!path)
        {
            scene[pathProperty] = "";
            scene[targetObjectProperty] = null;
            return true;
        }

        scene[pathProperty] = path;
        const result = await tw2.Fetch(path, awaitCompleted);

        // Only load if it hasn't already been replaced
        if (scene[pathProperty] === path)
        {
            scene[targetObjectProperty] = result;
            return true;
        }

        return false;
    }

    static perFrameShadowData = {
        vs: [
            [ "ShadowViewProjection", 16 ],          // cb1[0..3] rows, used for gl_Position
            [ "ShadowView", 16 ],                   // cb1[4..7] rows, used for texcoord3 + clipZ row at cb1[6]
            [ "ShadowNearFar", 4 ],                 // cb1[8] : x=near, y=far, z/w unused
        ],
        ps: [

        ]
    };

    /**
     * Per frame data
     * @type {*}
     */
    static perFrameData = {
        ps: [
            [ "ViewInverseTransposeMat", 16 ],
            [ "ViewMat", 16 ],
            [ "EnvMapRotationMat", 16 ],
            [ "SunData.DirWorld", 4 ],
            [ "SunData.DiffuseColor", 4 ],
            [ "SceneData.AmbientColor", 3 ],
            // Carbon: Vector3 AmbientColor followed by float ReflectionIntensity,
            // sharing one vec4. Named NebulaIntensity here until 2026-08-12, which
            // fed the wrong authored value to every shader reading it.
            [ "SceneData.ReflectionIntensity", 1 ],
            [ "SceneData.FogColor", 4 ],
            [ "ViewportOffset", 2 ],
            [ "ViewportSize", 2 ],
            [ "TargetResolution", 4 ],
            // RESERVED, NEVER WRITTEN. GLES does not use shadows. Both slots
            // stay declared because removing them would shift every register
            // after them, and the GLES shaders were compiled against these
            // positions.
            //
            // They align with Carbon PerFramePS 18 and 19, but do not treat
            // that as a shortcut: the dx11 producer authors those from Carbon's
            // meanings - 19 is ShadowCameraRange.xy, ShadowLightness, and a
            // uint ShadowQuality - rather than letting Tw2CarbonData's copy of
            // the head registers carry whatever happens to sit here.
            //
            // The per-field descriptions that used to annotate these were
            // guesses from ccpwgl's experimental shadow path and have been
            // removed rather than left to read as measured facts.
            [ "ShadowMapSettings", 4 ],
            [ "ShadowCameraRange", 4 ],
            [ "ProjectionToView", 2 ],
            [ "FovXY", 2 ],
            [ "MiscSettings", 4 ], // currentTime, fogType, fogBlur, 1
            [ "VolumetricSlices", 4 ]
        ],
        vs: [
            [ "ViewInverseTransposeMat", 16 ],
            [ "ViewProjectionMat", 16 ],
            [ "ViewMat", 16 ],
            [ "ProjectionMat", 16 ],
            [ "ShadowViewMat", 16 ],
            [ "ShadowViewProjectionMat", 16 ],
            [ "EnvMapRotationMat", 16 ],
            [ "SunData.DirWorld", 4 ],
            [ "SunData.DiffuseColor", 4 ],
            [ "FogFactors", 4 ],
            [ "TargetResolution", 4 ],
            [ "ViewportAdjustment", 4 ],
            [ "MiscSettings", 4 ] // currentTime, unused, viewportWidth, viewportHeight
        ]
    };

    /**
     * Class global and scratch variables
     * @type {?*}
     */
    static global = {
        vec3_ZERO: vec3.create(),
        vec3_0: vec3.create(),
        vec4_0: vec4.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        mat4_2: mat4.create()
    };


}
