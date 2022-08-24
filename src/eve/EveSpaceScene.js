import { meta } from "utils";
import { device, tw2 } from "global";
import { vec3, vec4, quat, mat4 } from "math";
import {
    Tw2BatchAccumulator,
    Tw2RawData,
    Tw2Frustum,
    Tw2BatchAccumulator2,
    Tw2DepthRenderTarget,
    Tw2Effect,
    Tw2PostProcess
} from "core";
import { RM_DEPTH, RM_DISTORTION, RM_OPAQUE } from "constant";


@meta.type("EveSpaceScene")
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
    enableShadows = false;

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

    @meta.path
    @meta.isPrivate
    postProcessPath = "";

    @meta.struct("Tw2PostProcess")
    postProcess = null;

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
        clearColor: true,
        debug: false,
        distortion: true,
        distortionPreview: false,
        environment: true,
        environmentReflection: true,
        environmentDiffuse: true,
        environmentBlur: true,
        fog: true,
        lensflares: true,
        lineSets: true,
        objects: true,
        planets: true,
        post: true,
        shadow: true,
    };

    @meta.color
    selectorColor=vec4.fromValues(0.5,0.3,0.0,1.0);

    _shadowView = mat4.create();
    _shadowProjection = mat4.create();
    _shadowViewProjection = mat4.create();
    _shadowCameraRange = vec4.fromValues(1,0,0,0);
    _shadowMapSettings = vec4.fromValues(1,1,0,0);
    _shadowMapRes = null;

    _localTransform = mat4.create();
    _accumulator = new Tw2BatchAccumulator();
    _emptyTexture = null;
    _frustum = new Tw2Frustum();
    _lodEnabled = false;

    _perFrameVS = Tw2RawData.from(EveSpaceScene.perFrameData.vs);
    _perFramePS = Tw2RawData.from(EveSpaceScene.perFrameData.ps);

    _envMapRes = null;
    _envMap1Res = null;
    _envMap2Res = null;

    _internalEffect = null;
    _internalRenderTarget = null;
    _depthAccumulator = null;
    _depthTexture = null;
    _distortionAccumulator = null;
    _distortionPostProcess = null;
    _depthRendered = false;

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
        return EveSpaceScene.HandleResource(this, path, "postProcessPath", "postProcess", awaitCompleted);
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
            this._emptyTexture = tw2.GetResource("cdn:/texture/global/black.png");
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

        if (this.postProcess)
        {
            this.postProcess.Update(dt, this);
        }
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
                objectArray[i].GetBatches(mode, accumulator);
            }
        }
    }

    /**
     * Renders the background effect
     * @param {Boolean} [force=this.backgroundRenderingEnabled]
     */
    RenderBackgroundEffect(force = this.backgroundRenderingEnabled)
    {
        if (this.backgroundEffect)
        {
            if (force)
            {
                device.SetStandardStates(device.RM_FULLSCREEN);
                device.RenderCameraSpaceQuad(this.backgroundEffect);
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
    RenderPlanets(dt, accumulator=this._accumulator)
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
                this.planets[i].GetBatches(device.RM_OPAQUE, accumulator);
                this.planets[i].GetBatches(device.RM_DECAL, accumulator);
                this.planets[i].GetBatches(device.RM_TRANSPARENT, accumulator);
                this.planets[i].GetBatches(device.RM_ADDITIVE, accumulator);
            }
        }

        this._accumulator.Render();
        device.SetProjection(tempProj, true);
        this.UpdateViewProjectionFrameData();
        device.gl.depthRange(0, 0.9);
    }

    _customPass = null;

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

        this.ApplyPerFrameData();
        this.RenderBackgroundEffect(this.backgroundRenderingEnabled);

        if (show.planets)
        {
            this.RenderPlanets(dt);
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

                this.backgroundObjects[i].GetBatches(d.RM_OPAQUE, this._accumulator);
                this.backgroundObjects[i].GetBatches(d.RM_DECAL, this._accumulator);
                this.backgroundObjects[i].GetBatches(d.RM_TRANSPARENT, this._accumulator);
                this.backgroundObjects[i].GetBatches(d.RM_ADDITIVE, this._accumulator);

                if (show.distortionPreview)
                {
                    this.backgroundObjects[i].GetBatches(d.RM_DISTORTION, this._accumulator);
                }
            }
        }

        if (show.objects)
        {
            for (let i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].UpdateViewDependentData)
                {
                    this.objects[i].UpdateViewDependentData(this._localTransform, dt);
                }

                this.objects[i].GetBatches(d.RM_OPAQUE, this._accumulator);
                this.objects[i].GetBatches(d.RM_DECAL, this._accumulator);
                this.objects[i].GetBatches(d.RM_TRANSPARENT, this._accumulator);
                this.objects[i].GetBatches(d.RM_ADDITIVE, this._accumulator);

                if (show.distortionPreview)
                {
                    this.objects[i].GetBatches(d.RM_DISTORTION, this._accumulator);
                }
            }
        }

        if (show.lineSets)
        {
            for (let i = 0; i < this.lineSets.length; i++)
            {
                this.lineSets[i].UpdateViewDependentData(this._localTransform, dt);
                this.lineSets[i].GetBatches(d.RM_TRANSPARENT, this._accumulator);
                this.lineSets[i].GetBatches(d.RM_ADDITIVE, this._accumulator);
            }
        }

        if (show.planets)
        {
            for (let i = 0; i < this.planets.length; ++i)
            {
                this.planets[i].GetZOnlyBatches(d.RM_OPAQUE, this._accumulator);
            }
        }

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].PrepareRender(this.sunDirection);
                this.lensflares[i].GetBatches(d.RM_ADDITIVE, this._accumulator);
            }
        }

        this._accumulator.Render();

        if (this.starfield)
        {
            // TODO: Implement starfield
        }

        if (this.shadowEffect)
        {
            // TODO: Implement shadow effect
        }

        if (show.lensflares)
        {
            for (let i = 0; i < this.lensflares.length; ++i)
            {
                this.lensflares[i].UpdateOccluders(); // World transform applied here?
            }
        }

        if (this._customPass)
        {
            this._customPass(dt, this);
        }

        if (this.postProcess)
        {
            this.postProcess.Render(dt);
        }

        this.RenderDepth();
        this.RenderDistortion();
    }

    /**
     * Renders depth
     * @param {Number} dt
     * @param {Boolean} [force]
     * @returns {boolean} true if completed
     */
    RenderDepth(dt, force)
    {
        this._depthRendered = false;

        if (!this.depthCalculation && !force)
        {
            return false;
        }

        if (!this._depthAccumulator)
        {
            this._depthAccumulator = new Tw2BatchAccumulator2();
        }
        else
        {
            this._depthAccumulator.Clear();
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

        if (this.visible.objects)
        {
            this._depthAccumulator.GetObjectArrayBatches(this.objects, RM_DEPTH, "Main");
            this._depthAccumulator.GetObjectArrayBatches(this.objects, RM_OPAQUE, "Depth");
        }

        if (this.visible.backgroundObjects)
        {
            this._depthAccumulator.GetObjectArrayBatches(this.backgroundObjects, RM_DEPTH, "Main");
            this._depthAccumulator.GetObjectArrayBatches(this.objects, RM_OPAQUE, "Depth");
        }

        this._internalRenderTarget.SetCallUnset(() =>
        {
            tw2.ClearBufferBits(true, true, true);
            this._depthAccumulator.Render();
        });

        this._depthRendered = true;
        return true;
    }

    /**
     * Renders distortion
     * @param {Number} dt
     * @returns {boolean} true if completed
     */
    RenderDistortion(dt)
    {
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
                effectFilePath: "cdn:/graphics/effect.gles2/managed/space/postprocess/distortion.sm_hi",
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

        if (!this._distortionAccumulator)
        {
            this._distortionAccumulator = new Tw2BatchAccumulator2();
        }
        else
        {
            this._distortionAccumulator.Clear();
        }

        if (this.visible.objects)
        {
            this._distortionAccumulator.GetObjectArrayBatches(this.objects, RM_DISTORTION, "Main");
        }

        if (this.visible.backgroundObjects)
        {
            this._distortionAccumulator.GetObjectArrayBatches(this.backgroundObjects, RM_DISTORTION, "Main");
        }

        if (!this._distortionAccumulator.length)
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
            this._distortionAccumulator.Render();
        });

        this._distortionPostProcess.Render(dt);
    }

    /**
     * Applies view projection frame data
     */
    UpdateViewProjectionFrameData()
    {
        device.UpdateViewProjection();

        const
            d = device,
            sunDir = EveSpaceScene.global.vec3_0,
            vs = this._perFrameVS,
            ps = this._perFramePS;

        d.perFrameVSData = vs;
        d.perFramePSData = ps;

        // Sun direction
        vec3.transformMat4(sunDir, this.sunDirection, this._localTransform);
        vec3.negate(sunDir, sunDir);
        vec3.normalize(sunDir, sunDir);

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
    }

    /**
     * Applies per frame data
     */
    ApplyPerFrameData()
    {
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

        // Shadows
        if (this.enableShadows)
        {
            mat4.multiply(this._shadowViewProjection, this._shadowProjection, this._shadowView);
            vs.Set("ShadowViewMat", mat4.transpose(g.mat4_0, this._shadowView));
            vs.Set("ShadowViewProjectionMat", mat4.transpose(g.mat4_1, this._shadowViewProjection));
        }

        ps.Set("ShadowMapSettings", this._shadowMapSettings); // TODO: Identify source of this information
        ps.Set("ShadowCameraRange", this._shadowCameraRange); // TODO: Identify source of this information

        ps.Set("EnvMapRotationMat", envMapTransform);
        ps.Set("SunData.DiffuseColor", this.sunDiffuseColor);
        ps.Set("SceneData.AmbientColor", this.ambientColor);
        ps.SetIndex("SceneData.NebulaIntensity", 0, this.nebulaIntensity);
        ps.SetIndex("ViewportSize", 0, d.viewportWidth);
        ps.SetIndex("ViewportSize", 1, d.viewportHeight);

        let envMap = this.GetEmptyTexture(),
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
            scene[pathProperty] = null;
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
            [ "Unknown0", 4 ]
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
    static global = {
        vec3_ZERO: vec3.create(),
        vec3_0: vec3.create(),
        vec4_0: vec4.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        mat4_2: mat4.create()
    };


}
