import { meta } from "utils";
import { device, tw2 } from "global";
import { vec3, vec4, quat, mat4 } from "math";
import { CewgLightCollector } from "core/cewg/CewgLightCollector";
import { CewgResourceBinder } from "core/cewg/CewgResourceBinder";
import { EveSpaceSceneShadowHandler } from "./EveSpaceSceneShadowHandler";
import { EveSpaceSceneAO, DEFAULT_AO_POST_EFFECT } from "./post/ao";
import {
    Tw2BatchAccumulator,
    Tw2RawData,
    Tw2Frustum,
    Tw2BatchAccumulator2,
    Tw2RenderBatchContext,
    Tw2DepthRenderTarget,
    Tw2Effect,
    Tw2PostProcess, Tw2TextureRes, Tw2TextureParameter, Tw2RenderTarget
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

    @meta.notImplemented
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
    _depthAccumulator = null;
    _depthContext = null;
    _depthContextReport = null;
    _depthTexture = null;
    _distortionAccumulator = null;
    _distortionContext = null;
    _distortionContextReport = null;
    _distortionPostProcess = null;
    _depthRendered = false;
    _customPasses = [];
    shadowHandler = null;

    @meta.struct("EveSpaceSceneAO")
    aoHandler = null;

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
            this._emptyTexture = tw2.GetResource("res:/texture/global/black.png");
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

        this.UpdateCewgLights(dt);

        if (this.postprocess)
        {
            this.postprocess.Update(dt, this);
        }
    }

    /**
     * Collects dynamic lights from light-owning children into the CEWG
     * light list (translated DX11 shader path). Additive: legacy v8
     * shaders never read the light-list textures, so this is inert
     * until a CEWG effect samples them. Mirrors Carbon's per-frame
     * pull (EveSpaceScene.cpp:1375-1416): clear -> GetLights on every
     * owner -> resolve/cull -> hand the list to the binder.
     * @param {Number} dt - delta time
     */
    UpdateCewgLights(dt)
    {
        if (!this._cewgLightCollector)
        {
            this._cewgLightCollector = new CewgLightCollector();
        }

        const
            d = device,
            collector = this._cewgLightCollector;

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

        CewgResourceBinder.Get(d).SetLightList(collector.GetLightList());
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

        // Ambient occlusion prepass (produces SSAOMap) before the main colour
        // pass samples it. Self-disables on error so a broken AO can't take the
        // whole scene render down.
        const aoHandler = this.GetAOHandler();
        if (aoHandler && show.ao)
        {
            try
            {
                aoHandler.Render(dt, this);
            }
            catch (err)
            {
                this.visible.ao = false;
                if (tw2.Warning) tw2.Warning({ name: "SSAO", description: String(err && err.message || err) });
            }
        }

        this.RenderCollectedBatches(mainAccumulator);

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

            this._perFrameVS.Set("ShadowViewMat", shadowViewTranspose);
            this._perFrameVS.Set("ShadowViewProjectionMat", shadowViewProjectionTranspose);

            this._perFrameShadowVS.Set("ShadowView", shadowViewTranspose);
            this._perFrameShadowVS.Set("ShadowViewProjection", shadowViewProjectionTranspose);
            this._perFrameShadowVS.Set("ShadowNearFar", [ device.nearPlane, device.farPlane || 1, 0, 0 ]);

        }

        // Use scene values by default
        const shadowMapSettings = [
                this._shadowMapOffsetX,
                this._shadowMapOffsetY,
                this._shadowDepthBias,
                this.shadowFadeThreshold
            ],
            shadowCameraRange = [
                this._shadowCameraNear,
                this._shadowCameraFar,
                this._shadowMinimumVisibility,
                0
            ];

        // For debugging, we'll guess the correct values
        if (this._enableShadowAutoSettings)
        {
            shadowMapSettings[0] = this.enableShadows ? 0 : 0;
            shadowMapSettings[1] = this.enableShadows ? 0 : 0;
            shadowMapSettings[2] = this.enableShadows ? 0 : 0;
            shadowMapSettings[3] = this.enableShadows ? 0 : 0;

            shadowCameraRange[0] = this.enableShadows ? 0 : 1; // Switches on/off shadows
            shadowCameraRange[1] = this.enableShadows ? this._shadowCameraFar : 1;
            shadowCameraRange[2] = this._shadowMinimumVisibility;
        }

        this._perFramePS.Set("ShadowMapSettings", shadowMapSettings);
        this._perFramePS.Set("ShadowCameraRange", shadowCameraRange);

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
            ps.Set("SceneData.FogColor", this.fogColor);
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
        ps.SetIndex("SceneData.NebulaIntensity", 0, this.nebulaIntensity);
        ps.SetIndex("ViewportSize", 0, d.viewportWidth);
        ps.SetIndex("ViewportSize", 1, d.viewportHeight);

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
            [ "SceneData.NebulaIntensity", 1 ],
            [ "SceneData.FogColor", 4 ],
            [ "ViewportOffset", 2 ],
            [ "ViewportSize", 2 ],
            [ "TargetResolution", 4 ],
            [ "ShadowMapSettings", 4 ],
            // shadow atlas offset x (high)
            // shadow atlas offset y (high)
            // shadow depth bias (very high)
            // shadow fade threshold (medium-high)
            [ "ShadowCameraRange", 4 ],
            // shadow camera range (very high) - shadow enable/ mode switch : 0 shadows on, 1 no shadows
            // shadow depth normalisation max (high)
            // shadow minimum shadow visibility (very high) - 0: full darkness, 0.2 - 0.4 soft, lifted shadows
            // unused (correct)
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
