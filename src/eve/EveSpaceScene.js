import {vec3, vec4, quat, mat4, util, device, resMan, tw2, Tw2BaseClass} from "../global";
import {Tw2BatchAccumulator, Tw2RawData, Tw2Frustum, Tw2Effect, Tr2PostProcess} from "../core";

/**
 * EveSpaceScene
 * TODO: Identify where to set "shadowFadeThreshold" in ps frame data
 * TODO: Identify where to set "shadowThreshold" in ps frame data
 * TODO: Identify if/where/how to set "enableShadows" in ps frame data
 * TODO: Identify if/where/how to set "selfShadowOnly" in ps frame data
 * TODO: Identify if shadows require their own render mode and render batch accumulation
 * TODO: Implement "externalParameters"
 * TODO: Implement "selfShadowOnly"
 * TODO: Implement "shLightingManager"
 * TODO: Implement "shadowFadeThreshold"
 * TODO: Implement "shadowThreshold"
 * TODO: Implement "starField"
 * TODO: Implement "sunDiffuseColorWithDynamicLights"
 * TODO: Implement "postProcess"
 * @ccp EveSpaceScene
 *
 * @property {vec4} ambientColor                                                     -
 * @property {Tr2Effect} backgroundEffect                                            -
 * @property {Array.<EveObject>} backgroundObjects                                   -
 * @property {Boolean} backgroundRenderingEnabled                                    -
 * @property {Array.<Tw2CurveSet>} curveSets                                         -
 * @property {Boolean} enableShadows                                                 -
 * @property {String} envMap1ResPath                                                 -
 * @property {String} envMap2ResPath                                                 -
 * @property {String} envMapResPath                                                  -
 * @property {quat} envMapRotation                                                   -
 * @property {Array.<Tr2ExternalParameter>} externalParameters                       -
 * @property {vec4} fogColor                                                         -
 * @property {Number} fogEnd                                                         -
 * @property {Number} fogMax                                                         -
 * @property {Number} fogStart                                                       -
 * @property {Number} nebulaIntensity                                                -
 * @property {Array.<EveEffectRoot2|EveRootTransform|EveObject|EveStation2>} objects -
 * @property {String} postProcessPath                                                -
 * @property {Boolean} selfShadowOnly                                                -
 * @property {Tr2ShLightingManager} shLightingManager                                -
 * @property {Number} shadowFadeThreshold                                            -
 * @property {Number} shadowThreshold                                                -
 * @property {EveStarfield} starfield                                                -
 * @property {vec4} sunDiffuseColor                                                  -
 * @property {vec4} sunDiffuseColorWithDynamicLights                                 -
 * @property {vec3} sunDirection                                                     -
 * @property {Boolean} useSunDiffuseColorWithDynamicLights                           -
 * @property {vec4} clearColor
 * @property {Boolean} display
 * @property {vec3} envMapScaling
 * @property {Number} fogBlur
 * @property {Number} fogType
 * @property {Array.<EveLensflare>} lensflares
 * @property {mat4} localTransform
 * @property {Array.<EvePlanet>} planets
 * @property {Tr2PostProcess} postProcess
 * @property {*} visible
 * @property {*} debugHelper
 * @property {Tw2BatchAccumulator} _batches
 * @property {Tw2TextureRes} _emptyTexture
 * @property {Tw2Frustum} _frustum
 * @property {Boolean} _lodEnabled
 * @property {Tw2RawData} _perFrameVS
 * @property {Tw2RawData} _perFramePS
 * @property {Tw2TextureRes} _envMapRes
 * @property {Tw2TextureRes} _envMap1Res
 * @property {Tw2TextureRes} _envMap1Res
 */
export class EveSpaceScene extends Tw2BaseClass
{
    // ccp
    ambientColor = vec4.fromValues(0.25, 0.25, 0.25, 1);
    backgroundEffect = null;
    backgroundObjects = [];
    backgroundRenderingEnabled = true;
    curveSets = [];
    enableShadows = false;
    envMap1ResPath = "";
    envMap2ResPath = "";
    envMapResPath = "";
    envMapRotation = quat.create();
    externalParameters = [];
    fogColor = vec4.fromValues(0.25, 0.25, 0.25, 1);
    fogEnd = 0;
    fogMax = 0;
    fogStart = 0;
    nebulaIntensity = 1;
    objects = [];
    postProcessPath = "";
    selfShadowOnly = false;
    shLightingManager = null;
    shadowFadeThreshold = 0;
    shadowThreshold = 0;
    starfield = null;
    sunDiffuseColor = vec4.fromValues(1, 1, 1, 1);
    sunDiffuseColorWithDynamicLights = vec4.fromValues(1, 1, 1, 1);
    sunDirection = vec3.fromValues(1, -1, 1);
    useSunDiffuseColorWithDynamicLights = false;

    //ccpwgl
    clearColor = vec4.fromValues(0, 0, 0, 1);
    display = true;
    envMapScaling = vec3.fromValues(1, 1, 1); // Should this come from the background effect?
    fogBlur = 0;
    fogType = 0;
    lensflares = [];
    localTransform = mat4.create();
    planets = [];
    postProcess = null;
    //shadowEffect = null;
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
        objects: true,
        planets: true,
        post: true,
        //shadow: true,
        starField: true
    };

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
        if (this._envMap1Res && !out.includes(this._envMap1Res)) out.push(this._envMapRes);
        if (this._envMap2Res && !out.includes(this._envMap2Res)) out.push(this._envMapRes);

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
     * @param {*} [argument]
     */
    PerChildObject(funcName, argument)
    {
        for (let i = 0; i < this.planets.length; i++)
        {
            if (funcName in this.planets[i])
            {
                this.planets[i][funcName](argument);
            }
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            if (funcName in this.objects[i])
            {
                this.objects[i][funcName](argument);
            }
        }

        for (let i = 0; i < this.backgroundObjects.length; i++)
        {
            if (funcName in this.backgroundObjects[i])
            {
                this.backgroundObjects[i][funcName](argument);
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

    spriteScale = 1;

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
            tr = this.localTransform,
            spriteScale = mat4.maxScaleOnAxis(tr) * this.spriteScale,
            show = this.visible;

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
                    this.planets[i].UpdateViewDependentData(tr, dt);
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
                    this.objects[i].UpdateViewDependentData(tr, dt, spriteScale);
                }
            }
        }

        if (show.backgroundObjects)
        {
            for (let i = 0; i < this.backgroundObjects.length; i++)
            {
                if (this.backgroundObjects[i].UpdateViewDependentData)
                {
                    this.backgroundObjects[i].UpdateViewDependentData(tr, dt, spriteScale);
                }
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

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].GetBatches(d.RM_ADDITIVE, this._batches);
            }
        }

        this._batches.Render();

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].UpdateOccluders();
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
            envMapTransform = g.mat4_2,
            sunDir = g.vec3_0,
            show = this.visible;

        // Todo: Update from local transform??
        mat4.fromQuat(envMapTransform, this.envMapRotation);
        mat4.scale(envMapTransform, envMapTransform, this.envMapScaling);
        mat4.transpose(envMapTransform, envMapTransform);
        vec3.negate(sunDir, this.sunDirection);
        vec3.normalize(sunDir, sunDir);

        let distance = this.fogEnd - this.fogStart;
        if (Math.abs(distance) < 1e-5) distance = 1e-5;
        const f = 1.0 / distance;

        const vs = this._perFrameVS;
        vs.Set("FogFactors", [this.fogEnd * f, f, this.visible.fog ? this.fogMax : 0, 1]);
        vs.Set("ViewportAdjustment", [1, 1, 1, 1]);
        vs.Set("MiscSettings", [d.currentTime, 0, d.viewportWidth, d.viewportHeight]);
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
        ps.Set("MiscSettings", [d.currentTime, this.fogType, this.fogBlur, 1]);
        ps.Set("SceneData.FogColor", this.fogColor);
        ps.Set("FovXY", [d.targetResolution[3], d.targetResolution[2]]);
        ps.Set("ShadowMapSettings", [1, 1, 0, 0]);
        ps.Set("TargetResolution", d.targetResolution);
        ps.Get("SceneData.NebulaIntensity")[0] = this.nebulaIntensity;
        ps.Get("ViewportSize")[0] = d.viewportWidth;
        ps.Get("ViewportSize")[1] = d.viewportHeight;
        ps.Get("ShadowCameraRange")[0] = 1;
        ps.Get("ProjectionToView")[0] = -d.projection[14];
        ps.Get("ProjectionToView")[1] = -d.projection[10] - 1;
        d.perFramePSData = ps;

        const
            envMap = this._envMapRes && show.environmentReflection ? this._envMapRes : this.GetEmptyTexture(),
            envMap1 = this._envMap1Res && show.environmentDiffuse ? this._envMap1Res : this.GetEmptyTexture(),
            envMap2 = this._envMap2Res && show.environmentBlur ? this._envMap2Res : this.GetEmptyTexture();

        tw2.GetVariable("EveSpaceSceneEnvMap").SetTextureRes(envMap);
        tw2.GetVariable("EnvMap1").SetTextureRes(envMap1);
        tw2.GetVariable("EnvMap2").SetTextureRes(envMap2);
    }

    /**
     * Initializes class global and scratch variables
     */
    static init()
    {
        if (!EveSpaceScene.global)
        {
            EveSpaceScene.global = {
                vec3_0: vec3.create(),
                vec4_0: vec4.create(),
                mat4_0: mat4.create(),
                mat4_1: mat4.create(),
                mat4_2: mat4.create(),
            };
        }
    }

    /**
     * Per frame data
     * @type {*}
     */
    static perFrameData = {
        ps: [
            ["ViewInverseTransposeMat", 16],
            ["ViewMat", 16],
            ["EnvMapRotationMat", 16],
            ["SunData.DirWorld", 4],
            ["SunData.DiffuseColor", 4],
            ["SceneData.AmbientColor", 3],
            ["SceneData.NebulaIntensity", 1],
            ["SceneData.FogColor", 4],
            ["ViewportOffset", 2],
            ["ViewportSize", 2],
            ["TargetResolution", 4],
            ["ShadowMapSettings", 4],
            ["ShadowCameraRange", 4],
            ["ProjectionToView", 2],
            ["FovXY", 2],
            ["MiscSettings", 4],
        ],
        vs: [
            ["ViewInverseTransposeMat", 16],
            ["ViewProjectionMat", 16],
            ["ViewMat", 16],
            ["ProjectionMat", 16],
            ["ShadowViewMat", 16],
            ["ShadowViewProjectionMat", 16],
            ["EnvMapRotationMat", 16],
            ["SunData.DirWorld", 4],
            ["SunData.DiffuseColor", 4],
            ["FogFactors", 4],
            ["TargetResolution", 4],
            ["ViewportAdjustment", 4],
            ["MiscSettings", 4]
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["ambientColor", r.color],
            ["backgroundEffect", r.object],
            ["backgroundObjects", r.array],
            ["backgroundRenderingEnabled", r.boolean],
            ["curveSets", r.array],
            ["enableShadows", r.boolean],
            ["envMapResPath", r.path],
            ["envMap1ResPath", r.path],
            ["envMap2ResPath", r.path],
            ["envMapRotation", r.vector4],
            ["externalParameters", r.array],
            ["fogColor", r.color],
            ["fogStart", r.float],
            ["fogEnd", r.float],
            ["fogMax", r.float],
            ["nebulaIntensity", r.float],
            ["objects", r.array],
            ["postProcessPath", r.path],
            ["selfShadowOnly", r.boolean],
            ["starfield", r.object],
            ["shadowFadeThreshold", r.float],
            ["shadowThreshold", r.float],
            ["shLightingManager", r.object],
            ["sunDiffuseColor", r.color],
            ["sunDiffuseColorWithDynamicLights", r.vector4],
            ["sunDirection", r.vector3],
            ["useSunDiffuseColorWithDynamicLights", r.boolean]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 2;

}
