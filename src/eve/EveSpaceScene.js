import { meta } from "utils";
import { device, resMan, store } from "global";
import { vec3, vec4, quat, mat4 } from "math";
import { Tw2BatchAccumulator, Tw2RawData, Tw2Frustum } from "core";


@meta.type("EveSpaceScene")
export class EveSpaceScene extends meta.Model
{

    @meta.color
    ambientColor = vec4.fromValues(0.25, 0.25, 0.25, 1);

    @meta.struct("Tw2Effect")
    backgroundEffect = null;

    @meta.list("EveObject")
    backgroundObjects = [];

    @meta.boolean
    backgroundRenderingEnabled = true;

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.notImplemented
    @meta.boolean
    enableShadows = false;

    @meta.path
    envMap1ResPath = "";

    @meta.path
    envMap2ResPath = "";

    @meta.path
    envMapResPath = "";

    @meta.quaternion
    envMapRotation = quat.create();

    @meta.notImplemented
    @meta.list("Tr2ExternalParameter")
    externalParameters = [];

    @meta.color
    fogColor = vec4.fromValues(0.25, 0.25, 0.25, 1);

    @meta.float
    fogEnd = 0;

    @meta.float
    fogMax = 0;

    @meta.float
    fogStart = 0;

    @meta.notImplemented
    @meta.path
    lowQualityNebulaMixResPath = "";

    @meta.notImplemented
    @meta.path
    lowQualityNebulaResPath = "";

    @meta.float
    nebulaIntensity = 1;

    @meta.list("EveObject")
    objects = [];

    @meta.notImplemented
    @meta.path
    postProcessPath = "";

    @meta.notImplemented
    @meta.struct()
    postprocess = null;

    @meta.notImplemented
    @meta.boolean
    selfShadowOnly = false;

    @meta.notImplemented
    @meta.struct("Tr2ShLightingManager")
    shLightingManager = null;

    @meta.notImplemented
    @meta.float
    @meta.todo("Identify ps/vs frame data")
    shadowFadeThreshold = 0;

    @meta.notImplemented
    @meta.float
    @meta.todo("Identify ps/vs frame data")
    shadowThreshold = 0;

    @meta.notImplemented
    @meta.struct("EveStarField")
    starfield = null;

    @meta.color
    sunDiffuseColor = vec4.fromValues(1, 1, 1, 1);

    @meta.notImplemented
    @meta.color
    sunDiffuseColorWithDynamicLights = vec4.fromValues(1, 1, 1, 1);

    @meta.vector3
    sunDirection = vec3.fromValues(1, -1, 1);

    @meta.notImplemented
    @meta.boolean
    useSunDiffuseColorWithDynamicLights = false;

    @meta.color
    clearColor = vec4.fromValues(0, 0, 0, 1);

    @meta.boolean
    display = true;

    @meta.vector3
    envMapScaling = vec3.fromValues(1, 1, 1); // Should this come from the background effect?

    @meta.uint
    fogBlur = 0;

    @meta.uint
    fogType = 0;

    @meta.list("EveLensflare")
    lensflares = [];

    @meta.list("EvePlanet")
    planets = [];

    @meta.list("EveCurveLineSet")
    lineSets = [];

    @meta.notImplemented
    @meta.struct("Tr2PostProcess")
    postProcess = null;

    @meta.notImplemented
    @meta.struct("Tw2Effect")
    @meta.todo("Do shadows need their own render mode and batch accumulation?")
    shadowEffect = null;

    @meta.plain
    visible = {
        backgroundObjects: true,
        clearColor: true,
        debug: false,
        //environment: true,
        environmentReflection: true,
        environmentDiffuse: true,
        environmentBlur: true,
        fog: true,
        lensflares: true,
        lineSets: true,
        objects: true,
        planets: true,
        post: true,
        //shadow: true,
        starField: true
    };

    _localTransform = mat4.create();
    _debugHelper = null;
    _batches = new Tw2BatchAccumulator();
    _emptyTexture = null;
    _frustum = new Tw2Frustum();
    _lodEnabled = false;
    _perFrameVS = Tw2RawData.from(EveSpaceScene.perFrameData.vs);
    _perFramePS = Tw2RawData.from(EveSpaceScene.perFrameData.ps);
    _envMapRes = null;
    _envMap1Res = null;
    _envMap2Res = null;


    /**
     * Constructor
     */
    constructor()
    {
        super();

        Object.defineProperty(this.visible, "environment", {
            get: () => this.backgroundRenderingEnabled,
            set: bool => this.backgroundRenderingEnabled = bool ? 1 : 0
        });

        Object.defineProperty(this.visible, "shadow", {
            get: () => this.enableShadows,
            set: bool => this.enableShadows = bool ? 1 : 0
        });

        EveSpaceScene.init();
    }

    /**
     * Initializes the space scene
     */
    Initialize()
    {
        this.SetEnvMapReflection(this.envMapPath);
        this.SetEnvMapDiffuse(this.envMap1ResPath);
        this.SetEnvMapBlur(this.envMap2ResPath);
        this.SetPostProcess(this.postProcessPath);

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
     * Sets the post processing path
     * @param {String} path
     */
    SetPostProcess(path = "")
    {
        if (!path)
        {
            this.postProcessPath = "";
            this.postProcess = null;
        }
        else
        {
            this.postProcessPath = path.toLowerCase();
            resMan.GetObject(path, obj => this.postProcess = obj);
        }
    }

    /**
     * Sets the environment's reflection map
     * @param {String} path
     */
    SetEnvMapReflection(path = "")
    {
        if (!path)
        {
            this.envMapPath = "";
            this._envMapRes = null;
        }
        else
        {
            this.envMapResPath = path;
            this._envMapRes = resMan.GetResource(path);
        }
    }

    /**
     * Sets the environment's diffuse map
     * @param {String} path
     */
    SetEnvMapDiffuse(path = "")
    {
        if (!path)
        {
            this.envMap1ResPath = "";
            this._envMap1Res = null;
        }
        else
        {
            this.envMap1ResPath = path.toLowerCase();
            this._envMap1Res = resMan.GetResource(path);
        }
    }

    /**
     * Sets the environment's blur map (used for fog)
     * @param {String} path
     */
    SetEnvMapBlur(path = "")
    {
        if (!path)
        {
            this.envMap2ResPath = "";
            this._envMap1Res = null;
            return;
        }

        this.envMap2ResPath = path.toLowerCase();
        this._envMap2Res = resMan.GetResource(path);
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
        if (this.postProcess) this.postProcess.GetResources(out);
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

        for (let i = 0; i < this.objects.length; i++)
        {
            if (funcName in this.objects[i])
            {
                this.objects[i][funcName](...args);
            }
        }

        for (let i = 0; i < this.backgroundObjects.length; i++)
        {
            if (funcName in this.backgroundObjects[i])
            {
                this.backgroundObjects[i][funcName](...args);
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
            this._emptyTexture = resMan.GetResource("res:/texture/global/black.dds.0.png");
        }

        return this._emptyTexture;
    }


    /**
     * Per frame update that is called per frame
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].Update(dt);
        }

        this.PerChildObject("Update", dt);

        /*
        if (this.starField)
        {
            this.starField.Update(dt);
        }
        */
    }

    /**
     * Gets batches for rendering
     * @param {number} mode
     * @param {Array.<EveObject>} objectArray
     * @param {Tw2BatchAccumulator} [accumulator=this._batches]
     */
    RenderBatches(mode, objectArray, accumulator = this._batches)
    {
        for (let i = 0; i < objectArray.length; ++i)
        {
            if ("GetBatches" in objectArray[i])
            {
                objectArray[i].GetBatches(mode, accumulator);
            }
        }
    }

    /**
     * Updates children's view dependent data and renders them
     * @param {Number} dt - deltaTime
     */
    Render(dt)
    {
        this.ApplyPerFrameData();

        const
            d = device,
            g = EveSpaceScene.global,
            tr = this._localTransform,
            show = this.visible,
            worldSpriteScale = mat4.maxScaleOnAxis(this._localTransform);

        if (show["environment"] && this.backgroundEffect)
        {
            d.SetStandardStates(d.RM_FULLSCREEN);
            d.RenderCameraSpaceQuad(this.backgroundEffect);
        }

        if (show.planets && this.planets.length)
        {
            const
                tempProj = mat4.copy(g.mat4_0, d.projection),
                newProj = mat4.copy(g.mat4_1, d.projection),
                zn = 10000,
                zf = 1e11;

            newProj[10] = zf / (zn - zf);
            newProj[14] = (zf * zn) / (zn - zf);
            d.SetProjection(newProj, true);
            this.ApplyPerFrameData();

            for (let i = 0; i < this.planets.length; ++i)
            {
                if (this.planets[i].UpdateViewDependentData)
                {
                    this.planets[i].UpdateViewDependentData(tr, dt, worldSpriteScale);
                }
            }

            this._batches.Clear();
            d.gl.depthRange(0.9, 1);
            this.RenderBatches(d.RM_OPAQUE, this.planets);
            this.RenderBatches(d.RM_DECAL, this.planets);
            this.RenderBatches(d.RM_TRANSPARENT, this.planets);
            this.RenderBatches(d.RM_ADDITIVE, this.planets);
            this._batches.Render();
            d.SetProjection(tempProj, true);
            this.ApplyPerFrameData();
            d.gl.depthRange(0, 0.9);
        }

        if (this._lodEnabled)
        {
            this._frustum.Initialize(d.view, d.projection, d.viewportWidth, d.viewInverse, d.viewProjection);
            this.PerChildObject("UpdateLod", this._frustum);
        }

        if (show.objects)
        {
            for (let i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].UpdateViewDependentData)
                {
                    this.objects[i].UpdateViewDependentData(tr, dt, worldSpriteScale);
                }
            }
        }

        if (show.backgroundObjects)
        {
            for (let i = 0; i < this.backgroundObjects.length; i++)
            {
                if (this.backgroundObjects[i].UpdateViewDependentData)
                {
                    this.backgroundObjects[i].UpdateViewDependentData(tr, dt, worldSpriteScale);
                }
            }
        }

        if (show.lineSets)
        {
            for (let i = 0; i < this.lineSets.length; i++)
            {
                this.lineSets[i].UpdateViewDependentData(tr, dt);
            }
        }

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].PrepareRender();
            }
        }

        this._batches.Clear();

        if (show.planets)
        {
            for (let i = 0; i < this.planets.length; ++i)
            {
                this.planets[i].GetZOnlyBatches(d.RM_OPAQUE, this._batches);
            }
        }

        if (show.objects)
        {
            this.RenderBatches(d.RM_OPAQUE, this.objects);
            this.RenderBatches(d.RM_DECAL, this.objects);
            this.RenderBatches(d.RM_TRANSPARENT, this.objects);
            this.RenderBatches(d.RM_ADDITIVE, this.objects);
            //this.RenderBatches(d.RM_DISTORTION, this.objects);
        }

        if (show.backgroundObjects)
        {
            this.RenderBatches(d.RM_OPAQUE, this.backgroundObjects);
            this.RenderBatches(d.RM_DECAL, this.backgroundObjects);
            this.RenderBatches(d.RM_TRANSPARENT, this.backgroundObjects);
            this.RenderBatches(d.RM_ADDITIVE, this.backgroundObjects);
            //this.RenderBatched(d.RM_DISTORTION, this.backgroundObjects);
        }

        if (show.lineSets)
        {
            this.RenderBatches(d.RM_TRANSPARENT, this.lineSets);
            this.RenderBatches(d.RM_ADDITIVE, this.lineSets);
        }


        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].GetBatches(d.RM_ADDITIVE, this._batches);
            }
        }

        if (this.starfield)
        {
            // TODO: Implement starfield
        }

        if (this.postProcess)
        {
            // TODO: Implement post processing
        }

        this._batches.Render();

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].UpdateOccluders(); // World transform applied here?
            }
        }


        if (show.debug)
        {
            if (EveSpaceScene.DebugRenderer)
            {
                if (!this._debugHelper)
                {
                    this._debugHelper = new EveSpaceScene.DebugRenderer();
                }

                this.PerChildObject("RenderDebugInfo", this._debugHelper);
                this._debugHelper.Render();
            }
        }
    }

    /**
     * Applies per frame data
     */
    ApplyPerFrameData()
    {
        const
            d = device,
            g = EveSpaceScene.global,
            world = this._localTransform,
            envMapTransform = g.mat4_2,
            sunDir = g.vec3_0,
            show = this.visible;

        mat4.fromQuat(envMapTransform, this.envMapRotation);
        mat4.scale(envMapTransform, envMapTransform, this.envMapScaling);

        mat4.multiply(envMapTransform, envMapTransform, world);
        envMapTransform[12] = 0;
        envMapTransform[13] = 0;
        envMapTransform[14] = 0;

        mat4.transpose(envMapTransform, envMapTransform);

        // Sun direction
        vec3.transformMat4(sunDir, this.sunDirection, world);
        vec3.negate(sunDir, sunDir);
        vec3.normalize(sunDir, sunDir);

        let distance = this.fogEnd - this.fogStart;
        if (Math.abs(distance) < 1e-5) distance = 1e-5;
        const f = 1.0 / distance;

        const vs = this._perFrameVS;

        if (this.visible.fog)
        {
            vs.Set("FogFactors", [ this.fogEnd * f, f, this.fogMax, 1 ]);
        }
        else
        {
            vs.Set("FogFactors", [ 0, 0, 0, 0 ]);
        }

        vs.Set("ViewportAdjustment", [ 1, 1, 1, 1 ]);
        vs.Set("MiscSettings", [ d.currentTime, 0, d.viewportWidth, d.viewportHeight ]);
        vs.Set("SunData.DirWorld", sunDir);
        vs.Set("SunData.DiffuseColor", this.sunDiffuseColor);
        vs.Set("TargetResolution", d.targetResolution);
        vs.Set("ViewInverseTransposeMat", d.viewInverse);
        vs.Set("ViewProjectionMat", d.viewProjectionTranspose);
        vs.Set("ViewMat", d.viewTranspose);
        vs.Set("ProjectionMat", d.projectionTranspose);
        vs.Set("EnvMapRotationMat", envMapTransform);
        d.perFrameVSData = vs;

        const ps = this._perFramePS;
        ps.Set("ViewInverseTransposeMat", d.viewInverse);
        ps.Set("ViewMat", d.viewTranspose);
        ps.Set("EnvMapRotationMat", envMapTransform);
        ps.Set("SunData.DirWorld", sunDir);
        ps.Set("SunData.DiffuseColor", this.sunDiffuseColor);
        ps.Set("SceneData.AmbientColor", this.ambientColor);

        if (this.visible.fog)
        {
            ps.Set("SceneData.FogColor", this.fogColor);
            ps.Set("MiscSettings", [ d.currentTime, this.fogType, this.fogBlur, 1 ]);
        }
        else
        {
            ps.Set("SceneData.FogColor", [ 0, 0, 0, 0 ]);
            ps.Set("MiscSettings", [ d.currentTime, 0, 0, 1 ]);
        }

        ps.Set("FovXY", [ d.targetResolution[3], d.targetResolution[2] ]);
        ps.Set("ShadowMapSettings", [ 1, 1, 0, 0 ]);
        ps.Set("TargetResolution", d.targetResolution);

        ps.SetIndex("SceneData.NebulaIntensity", 0, this.nebulaIntensity);
        ps.SetIndex("ViewportSize", 0, d.viewportWidth);
        ps.SetIndex("ViewportSize", 1, d.viewportHeight);
        ps.SetIndex("ShadowCameraRange", 0, 1);
        ps.SetIndex("ProjectionToView", 0, -d.projection[14]);
        ps.SetIndex("ProjectionToView", 1, -d.projection[10] - 1);

        d.perFramePSData = ps;

        const
            envMap = this._envMapRes && show.environmentReflection ? this._envMapRes : this.GetEmptyTexture(),
            envMap1 = this._envMap1Res && show.environmentDiffuse ? this._envMap1Res : this.GetEmptyTexture(),
            envMap2 = this._envMap2Res && show.environmentBlur ? this._envMap2Res : this.GetEmptyTexture();

        /// Keep environment maps alive when the environment is disabled
        if (!show.environment)
        {
            const res = this.GetResources();
            res.forEach(res => res.KeepAlive());
        }

        store.variables.Get("EveSpaceSceneEnvMap").AttachTextureRes(envMap);
        store.variables.Get("EnvMap1").AttachTextureRes(envMap1);
        store.variables.Get("EnvMap2").AttachTextureRes(envMap2);
    }

    /**
     * Initializes class global and scratch variables
     */
    static init()
    {
        if (!EveSpaceScene.global)
        {
            EveSpaceScene.global = {
                vec3_ZERO: vec3.create(),
                vec3_0: vec3.create(),
                vec4_0: vec4.create(),
                mat4_0: mat4.create(),
                mat4_1: mat4.create(),
                mat4_2: mat4.create()
            };
        }
    }

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
            [ "ShadowCameraRange", 4 ],
            [ "ProjectionToView", 2 ],
            [ "FovXY", 2 ],
            [ "MiscSettings", 4 ], // currentTime, fogType, fogBlur, 1
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
            [ "MiscSettings", 4 ] // currentTime, 0, viewportWidth, viewportHeight
        ]
    };

    /**
     * Class global and scratch variables
     * @type {?*}
     */
    static global = null;

    /**
     * Debug renderer
     * @type {?Function}
     */
    static DebugRenderer = window["Tw2DebugRenderer"] || null;

}
