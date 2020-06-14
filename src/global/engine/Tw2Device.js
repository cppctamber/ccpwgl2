import { num, vec3, vec4, mat4 } from "../math";
import { get, isString } from "../util";
import { Tw2Effect } from "core/mesh/Tw2Effect";
import { Tw2VertexDeclaration } from "core/vertex/Tw2VertexDeclaration";
import { Tw2EventEmitter } from "../class/Tw2EventEmitter";
import {
    RM_ANY,
    RM_OPAQUE,
    RM_DECAL,
    RM_TRANSPARENT,
    RM_ADDITIVE,
    RM_FULLSCREEN,
    RM_PICKABLE,
    RM_DEPTH,
    RM_DISTORTION,
    RS_ZENABLE,
    RS_ZWRITEENABLE,
    RS_ALPHATESTENABLE,
    RS_SRCBLEND,
    RS_DESTBLEND,
    RS_CULLMODE,
    RS_ZFUNC,
    RS_ALPHAREF,
    RS_ALPHAFUNC,
    RS_ALPHABLENDENABLE,
    RS_CLIPPING,
    RS_CLIPPLANEENABLE,
    RS_COLORWRITEENABLE,
    RS_BLENDOP,
    RS_SCISSORTESTENABLE,
    RS_SLOPESCALEDEPTHBIAS,
    RS_DEPTHBIAS,
    RS_SEPARATEALPHABLENDENABLE,
    RS_SRCBLENDALPHA,
    RS_DESTBLENDALPHA,
    RS_BLENDOPALPHA,
    CULL_NONE,
    CULL_CW,
    CULL_CCW,
    CMP_NEVER,
    CMP_LESS,
    CMP_EQUAL,
    CMP_LEQUAL,
    CMP_GREATER,
    CMP_GREATEREQUAL,
    CMP_ALWAYS,
    BLEND_ONE,
    BLEND_SRCALPHA,
    BLEND_INVSRCALPHA,
    BLENDOP_ADD,
    BLENDOP_SUBTRACT,
    BLENDOP_REVSUBTRACT,
    BlendTable,
    WrapModes,
    VendorWebglPrefixes,
    VendorRequestAnimationFrame,
    VendorCancelAnimationFrame
} from "./Tw2Constant";
import {
    ErrWebglContext,
    ErrWebxrDeviceNotFound,
    ErrWebxrNotSupported,
    ErrWebxrRequestFailed,
    ErrWebxrSessionNotSupported
} from "core";

/**
 * Tw2Device
 *
 * @property {WebGLRenderingContext} gl            - The device's gl context
 * @property {*} xr                                - An optional xr handler
 * @property {vec3} eyePosition                    - The device's current eye position
 * @property {vec4} targetResolution               - The device's current target resolution
 * @property {mat4} world                          - The device's current world matrix
 * @property {mat4} view                           - The device's current view matrix
 * @property {mat4} viewInverse                    - The device's current inverse view matrix
 * @property {mat4} viewTranspose                  - The device's current view matrix transposed
 * @property {mat4} projection                     - The device's current projection matrix
 * @property {mat4} projectionInverse              - The device's current inverse projection matrix
 * @property {mat4} projectionTranspose            - The device's current projection matrix transposed
 * @property {mat4} viewProjection                 - The device's current view projection matrix
 * @property {mat4} viewProjectionTranspose        - The device's current view projection matrix transposed
 * @property {?HTMLCanvasElement} canvas           - The html canvas the gl context was created from
 * @property {number} viewportWidth                - The canvas's current width
 * @property {number} viewportHeight               - The canvas's current height
 * @property {number} viewportAspect               - The canvas's current display aspect
 * @property {number} viewportPixelRatio           - The canvas's pixel ratio
 * @property {String} effectDir                    - The directory used to translate ccp effect file paths
 * @property {number} mipLevelSkipCount            - Controls what quality ccp texture resource to load (mutates paths)
 * @property {String} shaderModel                  - Controls what quality ccp effect resource to load (mutates paths)
 * @property {Boolean} enableAnisotropicFiltering  - Enables anisotropic filtering
 * @property {Boolean} enableAntialiasing          - Enables antialiasing
 * @property {Boolean} enableWebgl2                - Enables webgl2
 * @property {Boolean} enableWebxr                 - Enables webvr (Not yet supported)
 * @property {Boolean} alphaBlendBackBuffer        - Enables alpha blending (glParams.alpha)
 * @property {Boolean} antialiasing                - Identifies if antialiasing is enabled
 * @property {number} msaaSamples                  - The amount of samples used for antialiasing
 * @property {number[]} wrapModes                  - texture wrap modes
 * @property {*} shadowHandles                     - unused
 * @property {Tw2PerObjectData} perObjectData      - The current frame's per object data
 * @property {Function} onResize                   - An optional function which is called on resize
 * @property {{}} _extensions                      - Stores loaded extensions
 * @property {{}} _alphaBlendState                 - Alpha states for blending
 * @property {{}} _alphaTestState                  - Alpha test states
 * @property {{}} _depthOffsetState                - Depth states
 * @property {Float32Array} _shadowStateBuffer     - unused
 * @property {WebGLBuffer} _quadBuffer             - Webgl buffer for full screen quad
 * @property {Tw2VertexDeclaration} _quadDecl      - Quad vertex declarations
 * @property {WebGLBuffer} _cameraQuadBuffer       - Webgl buffer for camera space quad
 * @property {number} _currentRenderMode           - The device's current render mode
 * @property {WebGLTexture} _fallbackCube          - A fallback cube texture
 * @property {WebGLTexture} _fallbackTexture       - A fallback texture
 * @property {Tw2Effect} _blitEffect               - The blit effect used for rendering textures
 * @class
 */
export class Tw2Device extends Tw2EventEmitter
{
    name = "Device";

    gl = null;
    xr = null;
    tw2 = null;

    canvas2d = null;

    dt = 0;
    frameCounter = 0;
    startTime = null;
    currentTime = null;
    previousTime = null;

    eyePosition = vec3.create();
    targetResolution = vec4.create();
    world = mat4.create();
    view = mat4.create();
    viewInverse = mat4.create();
    viewTranspose = mat4.create();
    projection = mat4.create();
    projectionInverse = mat4.create();
    projectionTranspose = mat4.create();
    viewProjection = mat4.create();
    viewProjectionTranspose = mat4.create();

    viewportWidth = 0;
    viewportHeight = 0;
    viewportAspect = 0;
    viewportPixelRatio = ("devicePixelRatio" in window) ? window.devicePixelRatio : 1;

    effectDir = "/effect.gles2/";
    mipLevelSkipCount = 0;
    shaderModel = "hi";
    enableAnisotropicFiltering = true;
    enableAntialiasing = true;
    enableWebgl2 = true;
    enableWebxr = true;

    alphaBlendBackBuffer = true;
    antialiasing = true;
    msaaSamples = 0;
    wrapModes = [];
    shadowHandles = null;
    perObjectData = null;

    onResize = null;

    _extensions = {};
    _alphaBlendState = null;
    _alphaTestState = null;
    _depthOffsetState = null;
    _shadowStateBuffer = null;
    _quadBuffer = null;
    _quadDecl = null;
    _cameraQuadBuffer = null;
    _currentRenderMode = RM_ANY;
    _fallbackCube = null;
    _fallbackTexture = null;
    _blitEffect = null;
    _Date = Date;

    /**
     * Gets the current gl context version
     * @returns {number}
     */
    get glVersion()
    {
        return !this.gl ? 0 : this.gl instanceof WebGLRenderingContext ? 1 : 2;
    }

    /**
     * Gets the current gl canvas
     * @returns {null}
     */
    get canvas()
    {
        return this.gl ? this.gl.canvas : null;
    }

    /**
     * Constructor
     * @param {Tw2Library} tw2
     */
    constructor(tw2)
    {
        super();
        tw2.SetLibrary(this);
        this.startTime = this.now;
        this.currentTime = this.startTime;
    }

    /**
     * Registers options
     * @param {*} [opt]
     * @param {Number} opt.textureQuality
     * @param {Number} opt.shaderQuality
     * @param {Boolean} opt.anisotropicFilter
     * @param {Boolean} opt.antialiasing
     * @param {Boolean} opt.webgl2
     * @param {Boolean} opt.webvr
     */
    Register(opt)
    {
        if (!opt) return;

        if (this.gl)
        {
            throw new Error("Setting device options after gl creation is not yet supported");
        }

        if ("performanceClock" in opt)
        {
            if (opt.performance && "performance" in window)
            {
                this._Date = performance;
            }
            else
            {
                this._Date = Date;
            }
        }

        if ("textureQuality" in opt) this.mipLevelSkipCount = opt.textureQuality;
        if ("shaderQuality" in opt) this.shaderModel = opt.shaderQuality;
        if ("anisotropicFilter" in opt) this.enableAnisotropicFiltering = opt.anisotropicFilter;
        if ("antialiasing" in opt) this.enableAntialiasing = opt.antialiasing;
        if ("webgl2" in opt) this.enableWebgl2 = opt.webgl2;
        if ("webxr" in opt) this.enableWebxr = opt.webxr;
    }

    /**
     * Creates webgl Device
     * @params {*} options
     * @throws ErrWebglContext           - When unable to create a webgl context
     */
    CreateDevice({ canvas, canvas2d, glParams = {} } = {})
    {
        this.gl = null;
        this.effectDir = "/effect.gles2/";

        const params = Object.assign({}, glParams);
        params.alpha = get(params, "alpha", true);
        params.webgl2 = this.enableWebgl2;
        params.xrCompatible = this.enableWebxr;
        params.antialiasing = this.enableAntialiasing ? get(params, "antialiasing", true) : false;

        const gl = this.gl = Tw2Device.CreateContext(params, canvas);
        this.msg("debug", `Webgl${this.glVersion} context created`);

        // Allow for a 2d canvas
        try
        {
            if (canvas2d)
            {
                if (isString(canvas2d))
                {
                    canvas2d = document.getElementById(canvas2d);
                }

                this.canvas2d = {
                    canvas: canvas2d,
                    context: canvas2d.getContext("2d"),
                    enabled: true,
                    autoResize: true,
                    OnResize: null,
                    OnDraw: null
                };
            }
        }
        catch(err)
        {
            throw new Error("Invalid 2d canvas");
        }

        const
            returnFalse = () => false,
            returnTrue = () => true;

        if (this.glVersion === 1)
        {
            this.GetExtension("OES_standard_derivatives");
            this.GetExtension("OES_element_index_uint");
            this.GetExtension("OES_texture_float");
            this.GetExtension("EXT_shader_texture_lod");
            const iArray = this.GetExtension("ANGLE_instanced_arrays");
            gl.drawElementsInstanced = iArray ? iArray["drawElementsInstancedANGLE"].bind(iArray) : returnFalse;
            gl.drawArraysInstanced = iArray ? iArray["drawArraysInstancedANGLE"].bind(iArray) : returnFalse;
            gl.vertexAttribDivisor = iArray ? iArray["vertexAttribDivisorANGLE"].bind(iArray) : returnFalse;
            gl.hasInstancedArrays = iArray ? returnTrue : returnFalse;
        }
        else
        {
            gl.hasInstancedArrays = returnTrue;
        }

        const anisotropicFilterExt = this.GetExtension("EXT_texture_filter_anisotropic");
        if (anisotropicFilterExt)
        {
            anisotropicFilterExt.maxAnisotropy = gl.getParameter(anisotropicFilterExt["MAX_TEXTURE_MAX_ANISOTROPY_EXT"]);
        }

        // CCP mobile shader binary (is this depreciated?)
        const ccpShaderBinary = this.GetExtension("CCP_shader_binary");
        if (ccpShaderBinary)
        {
            const
                renderer = gl.getParameter(this.gl.RENDERER),
                maliVer = renderer.match(/Mali-(\w+).*/);

            if (maliVer)
            {
                this.effectDir = "/effect.gles2.mali" + maliVer[1] + "/";
            }
        }

        // Quality
        this.alphaBlendBackBuffer = params.alpha;
        this.msaaSamples = this.gl.getParameter(this.gl.SAMPLES);
        this.antialiasing = this.msaaSamples > 1;

        this.Resize();

        const vertices = [
            1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ];

        this._quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this._cameraQuadBuffer = gl.createBuffer();
        this._quadDecl = Tw2VertexDeclaration.from([
            { usage: "POSITION", usageIndex: 0, elements: 4 },
            { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
        ]);

        this.wrapModes = Array.from(WrapModes);

        this._alphaBlendState = {
            dirty: false,
            states: {
                [RS_SRCBLEND]: BLEND_SRCALPHA,
                [RS_DESTBLEND]: BLEND_INVSRCALPHA,
                [RS_BLENDOP]: BLENDOP_ADD,
                [RS_SEPARATEALPHABLENDENABLE]: 0,
                [RS_BLENDOPALPHA]: BLENDOP_ADD,
                [RS_SRCBLENDALPHA]: BLEND_SRCALPHA,
                [RS_DESTBLENDALPHA]: BLEND_INVSRCALPHA,
            }
        };

        this._alphaTestState = {
            dirty: false,
            states: {
                [RS_ALPHATESTENABLE]: 0,
                [RS_ALPHAREF]: -1,
                [RS_ALPHAFUNC]: CMP_GREATER,
                [RS_CLIPPING]: 0,
                [RS_CLIPPLANEENABLE]: 0
            }
        };

        this._depthOffsetState = {
            dirty: false,
            states: {
                [RS_SLOPESCALEDEPTHBIAS]: 0,
                [RS_DEPTHBIAS]: 0
            }
        };

        this._shadowStateBuffer = new Float32Array(24);
    }

    /**
     * Sets the pixel aspect ratio and resizes afterwards
     * @param {Number} value
     */
    SetPixelRatio(value)
    {
        if (this.viewportPixelRatio !== value)
        {
            this.viewportPixelRatio = value;
            this.Resize();
        }
    }

    /**
     * Handles resize events
     */
    Resize()
    {
        if (this.onResize)
        {
            this.onResize(this.canvas);
        }
        /*
        else if (this.enableWebxr && this.xr && this.xr.isGood)
        {
            this.xr.OnResize(this.canvas);
        }
        */
        else
        {
            this.canvas.width = Math.floor(this.canvas.clientWidth * this.viewportPixelRatio);
            this.canvas.height = Math.floor(this.canvas.clientHeight * this.viewportPixelRatio);
        }

        this.viewportWidth = this.canvas.width;
        this.viewportHeight = this.canvas.height;
        this.viewportAspect = this.viewportWidth / this.viewportHeight;

        const event = {
            width: this.viewportWidth,
            height: this.viewportHeight,
            aspect: this.viewportAspect,
        };

        // Handle 2d canvas
        if (this.canvas2d && this.canvas2d.enabled)
        {
            if (this.canvas2d.autoResize)
            {
                this.canvas2d.canvas.width = this.viewportWidth;
                this.canvas2d.canvas.height = this.viewportHeight;
            }

            if (this.canvas2d.OnResize)
            {
                this.canvas2d.OnResize(event);
            }
        }

        this.tw2.SetVariableValue("ViewportSize", [
            this.viewportWidth,
            this.viewportHeight,
            this.viewportWidth,
            this.viewportHeight
        ]);

        this.emit("resized", event);
    }

    /**
     * Gets the current time
     * @returns {number}
     */
    get now()
    {
        return this._Date.now();
    }

    /**
     * Fires on the start of a frame
     */
    StartFrame()
    {
        if (this.canvas.clientWidth !== this.viewportWidth || this.canvas.clientHeight !== this.viewportHeight)
        {
            this.Resize();
        }

        const
            previousTime = this.previousTime === null ? 0 : this.previousTime,
            now = this.now;

        this.currentTime = (now - this.startTime) * 0.001;
        this.dt = this.previousTime === null ? 0 : (now - this.previousTime) * 0.001;
        this.previousTime = now;

        this.tw2.SetVariableValue("Time", [
            this.currentTime,
            this.currentTime - Math.floor(this.currentTime),
            this.frameCounter,
            previousTime
        ]);

        this.frameCounter++;
    }

    /**
     * Fires on the end of a frame
     */
    EndFrame()
    {
        if (this.canvas2d && this.canvas2d.enabled && this.canvas2d.OnDraw)
        {
            this.canvas2d.OnDraw();
        }
    }

    /**
     * Sets World transform matrix
     * @param {mat4} matrix
     */
    SetWorld(matrix)
    {
        mat4.copy(this.world, matrix);
    }

    /**
     * Sets view matrix
     * @param {mat4} matrix
     */
    SetView(matrix)
    {
        mat4.copy(this.view, matrix);
        mat4.invert(this.viewInverse, this.view);
        mat4.transpose(this.viewTranspose, this.view);
        mat4.getTranslation(this.eyePosition, this.viewInverse);
        this.UpdateViewProjection();
    }

    /**
     * Sets projection matrix
     * @param {mat4} matrix
     * @param {Boolean} [forceUpdateViewProjection]
     */
    SetProjection(matrix, forceUpdateViewProjection)
    {
        mat4.copy(this.projection, matrix);
        mat4.transpose(this.projectionTranspose, this.projection);
        mat4.invert(this.projectionInverse, this.projection);
        this.GetTargetResolution(this.targetResolution);
        if (forceUpdateViewProjection) this.UpdateViewProjection();
    }

    /**
     * Updates view projection matrices
     */
    UpdateViewProjection()
    {
        mat4.multiply(this.viewProjection, this.projection, this.view);
        mat4.transpose(this.viewProjectionTranspose, this.viewProjection);
        this.tw2.SetVariableValue("ViewProjectionMat", this.viewProjection);
    }

    /**
     * Gets the device's target resolution
     * @param {vec4} [out=vec4.create()]
     * @returns {vec4} out
     */
    GetTargetResolution(out = vec4.create())
    {
        const aspectRatio = this.projection[0] ? this.projection[5] / this.projection[0] : 0.0;
        let aspectAdjustment = 1.0;
        if (aspectRatio > 1.6) aspectAdjustment = aspectRatio / 1.6;
        const fov = 2.0 * Math.atan(aspectAdjustment / this.projection[5]);
        out[0] = this.viewportWidth;
        out[1] = this.viewportHeight;
        out[2] = fov;
        out[3] = fov * aspectRatio;
        return out;
    }

    /**
     * GetEyePosition
     * @param {vec3} [out=vec3.create()]
     * @return {vec3}
     */
    GetEyePosition(out = vec3.create())
    {
        return vec3.copy(out, this.eyePosition);
    }

    /**
     * Returns whether or not Alpha Test is enabled
     * return {Boolean}
     */
    IsAlphaTestEnabled()
    {
        return this._alphaTestState.states[RS_ALPHATESTENABLE];
    }

    /**
     * Checks if a frame buffer is complete
     *
     * @param frameBuffer
     * @returns {Boolean}
     */
    IsFrameBufferComplete(frameBuffer)
    {
        return this.gl.checkFramebufferStatus(frameBuffer) === this.gl.FRAMEBUFFER_COMPLETE;
    }

    /**
     * Gets a gl extension
     * @param {String} extension - The gl extension name
     * @returns {*}
     */
    GetExtension(extension)
    {
        if (!(extension in this._extensions))
        {
            let ext;
            for (let i = 0; i < VendorWebglPrefixes.length; i++)
            {
                ext = this.gl.getExtension(VendorWebglPrefixes[i] + extension);
                if (ext) break;
                ext = null;
            }

            this._extensions[extension] = ext;
        }

        return this._extensions[extension];
    }

    /**
     * Gets a fallback texture
     * @returns {*}
     */
    GetFallbackTexture()
    {
        if (!this._fallbackTexture)
        {
            this._fallbackTexture = this.CreateSolidTexture();
        }
        return this._fallbackTexture;
    }

    /**
     * Gets a fallback cube map
     * @returns {*}
     */
    GetFallbackCubeMap()
    {
        if (!this._fallbackCube)
        {
            this._fallbackCube = this.CreateSolidCube();
        }
        return this._fallbackCube;
    }

    /**
     * Creates a solid colored texture
     * @param {vec4|Array} [rgba] - The colour to create, if omitted defaults to completely transparent
     * @returns {WebGLTexture}
     */
    CreateSolidTexture(rgba = [ 0, 0, 0, 0 ])
    {
        const
            gl = this.gl,
            texture = this.gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }

    /**
     * Creates a solid coloured cube texture
     * @param {vec4|Array} rgba
     * @returns {WebGLTexture}
     */
    CreateSolidCube(rgba = [ 0, 0, 0, 0 ])
    {
        const
            gl = this.gl,
            texture = this.gl.createTexture();

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for (let j = 0; j < 6; ++j)
        {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        return texture;
    }

    /**
     * RenderFullScreenQuad
     * @param {Tw2Effect} effect
     * @param {String} technique - Technique name
     * @returns {Boolean}
     */
    RenderFullScreenQuad(effect, technique = "Main")
    {
        if (!effect || !effect.IsGood()) return false;

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!this._quadDecl.SetDeclaration(this, effect.GetPassInput(technique, pass), 24)) return false;
            this.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        return true;
    }

    /**
     * Renders a Texture to the screen
     * @param {Tw2TextureRes} texture
     * @returns {Boolean}
     */
    RenderTexture(texture)
    {
        if (this._blitEffect === null)
        {
            this._blitEffect = Tw2Effect.from({
                effectFilePath: "res:/graphics/effect/managed/space/system/blit.fx",
                textures: {
                    BlitSource: ""
                }
            });
        }

        this._blitEffect.parameters["BlitSource"].SetTextureRes(texture);
        return this.RenderFullScreenQuad(this._blitEffect);
    }

    /**
     * RenderCameraSpaceQuad
     * @param {Tw2Effect} effect
     * @param {String} technique - Technique name
     * @returns {Boolean}
     */
    RenderCameraSpaceQuad(effect, technique = "Main")
    {
        if (!effect || !effect.IsGood()) return false;

        const vertices = new Float32Array([
            1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ]);

        const projInv = this.projectionInverse;
        for (let i = 0; i < 4; ++i)
        {
            const vec = vertices.subarray(i * 6, i * 6 + 4);
            vec4.transformMat4(vec, vec, projInv);
            vec3.scale(vec, vec, 1 / vec[3]);
            vec[3] = 1;
        }

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._cameraQuadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!this._quadDecl.SetDeclaration(this, effect.GetPassInput(technique, pass), 24)) return false;
            this.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        return true;
    }

    /**
     * Set a render state
     * @param state
     * @param value
     */
    SetRenderState(state, value)
    {
        const gl = this.gl;
        this._currentRenderMode = RM_ANY;

        switch (state)
        {
            case RS_ZENABLE:
                if (value)
                {
                    gl.enable(gl.DEPTH_TEST);
                }
                else
                {
                    gl.disable(gl.DEPTH_TEST);
                }
                return;

            case RS_ZWRITEENABLE:
                gl.depthMask(!!value);
                return;

            case RS_ALPHATESTENABLE:
            case RS_ALPHAREF:
            case RS_ALPHAFUNC:
            case RS_CLIPPING:
            case RS_CLIPPLANEENABLE:
                if (this._alphaTestState[state] !== value)
                {
                    this._alphaTestState.states[state] = value;
                    this._alphaTestState.dirty = true;
                }
                return;

            case RS_SRCBLEND:
            case RS_DESTBLEND:
            case RS_BLENDOP:
            case RS_SEPARATEALPHABLENDENABLE:
            case RS_BLENDOPALPHA:
            case RS_SRCBLENDALPHA:
            case RS_DESTBLENDALPHA:
                if (this._alphaBlendState[state] !== value)
                {
                    this._alphaBlendState.states[state] = value;
                    this._alphaBlendState.dirty = true;
                }
                return;

            case RS_CULLMODE:
                switch (value)
                {
                    case CULL_NONE:
                        gl.disable(gl.CULL_FACE);
                        return;

                    case CULL_CW:
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.FRONT);
                        return;

                    case CULL_CCW:
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.BACK);
                        return;
                }
                return;

            case RS_ZFUNC:
                gl.depthFunc(0x0200 + value - 1);
                return;

            case RS_ALPHABLENDENABLE:
                if (value) gl.enable(gl.BLEND);
                else gl.disable(gl.BLEND);
                return;

            case RS_COLORWRITEENABLE:
                gl.colorMask((value & 1) !== 0, (value & 2) !== 0, (value & 4) !== 0, (value & 8) !== 0);
                return;

            case RS_SCISSORTESTENABLE:
                if (value) gl.enable(gl.SCISSOR_TEST);
                else gl.disable(gl.SCISSOR_TEST);
                return;

            case RS_SLOPESCALEDEPTHBIAS:
            case RS_DEPTHBIAS:
                value = num.dwordToFloat(value);
                if (this._depthOffsetState[state] !== value)
                {
                    this._depthOffsetState.states[state] = value;
                    this._depthOffsetState.dirty = true;
                }
                return;
        }
    }

    /**
     * ApplyShadowState
     */
    ApplyShadowState()
    {
        const gl = this.gl;

        if (this._alphaBlendState.dirty)
        {
            let blendOp = gl.FUNC_ADD;
            if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_SUBTRACT)
            {
                blendOp = gl.FUNC_SUBTRACT;
            }
            else if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_REVSUBTRACT)
            {
                blendOp = gl.FUNC_REVERSE_SUBTRACT;
            }

            const
                srcBlend = BlendTable[this._alphaBlendState.states[RS_SRCBLEND]],
                destBlend = BlendTable[this._alphaBlendState.states[RS_DESTBLEND]];

            if (this._alphaBlendState.states[RS_SEPARATEALPHABLENDENABLE])
            {
                let blendOpAlpha = gl.FUNC_ADD;
                if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_SUBTRACT)
                {
                    blendOpAlpha = gl.FUNC_SUBTRACT;
                }
                else if (this._alphaBlendState.states[RS_BLENDOP] === BLENDOP_REVSUBTRACT)
                {
                    blendOpAlpha = gl.FUNC_REVERSE_SUBTRACT;
                }

                const
                    srcBlendAlpha = BlendTable[this._alphaBlendState.states[RS_SRCBLENDALPHA]],
                    destBlendAlpha = BlendTable[this._alphaBlendState.states[RS_DESTBLENDALPHA]];

                gl.blendEquationSeparate(blendOp, blendOpAlpha);
                gl.blendFuncSeparate(srcBlend, destBlend, srcBlendAlpha, destBlendAlpha);
            }
            else
            {
                gl.blendEquation(blendOp);
                gl.blendFunc(srcBlend, destBlend);
            }
            this._alphaBlendState.dirty = false;
        }

        if (this._depthOffsetState.dirty)
        {
            gl.polygonOffset(
                this._depthOffsetState.states[RS_SLOPESCALEDEPTHBIAS],
                this._depthOffsetState.states[RS_DEPTHBIAS]);
            this._depthOffsetState.dirty = false;
        }

        let alphaTestFunc,
            invertedAlphaTest,
            alphaTestRef;

        if (this.shadowHandles && this._alphaTestState.states[RS_ALPHATESTENABLE])
        {
            switch (this._alphaTestState.states[RS_ALPHAFUNC])
            {
                case CMP_NEVER:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -256;
                    break;

                case CMP_LESS:
                    alphaTestFunc = 0;
                    invertedAlphaTest = -1;
                    alphaTestRef = this._alphaTestState.states[RS_ALPHAREF] - 1;
                    break;

                case CMP_EQUAL:
                    alphaTestFunc = 1;
                    invertedAlphaTest = 0;
                    alphaTestRef = this._alphaTestState.states[RS_ALPHAREF];
                    break;

                case CMP_LEQUAL:
                    alphaTestFunc = 0;
                    invertedAlphaTest = -1;
                    alphaTestRef = this._alphaTestState.states[RS_ALPHAREF];
                    break;

                case CMP_GREATER:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -this._alphaTestState.states[RS_ALPHAREF] - 1;
                    break;

                    /*
case CMP_NOTEQUAL:
var alphaTestFunc = 1;
var invertedAlphaTest = 1;
var alphaTestRef = this._alphaTestState.states[RS_ALPHAREF];
break;
*/

                case CMP_GREATEREQUAL:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -this._alphaTestState.states[RS_ALPHAREF];
                    break;

                default:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 0;
                    alphaTestRef = 1;
                    break;
            }

            const clipPlaneEnable = 0;
            gl.uniform4f(
                this.shadowHandles.shadowStateInt,
                invertedAlphaTest,
                alphaTestRef,
                alphaTestFunc,
                clipPlaneEnable);
            //this._shadowStateBuffers
        }
    }

    /**
     * Sets a render mode
     * @param {number} renderMode
     */
    SetStandardStates(renderMode)
    {
        if (this._currentRenderMode === renderMode) return;

        this.gl.frontFace(this.gl.CW);
        switch (renderMode)
        {
            case RM_OPAQUE:
            case RM_PICKABLE:
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, true);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_CULLMODE, CULL_CW);
                this.SetRenderState(RS_ALPHABLENDENABLE, false);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_DECAL:
                this.SetRenderState(RS_ALPHABLENDENABLE, false);
                this.SetRenderState(RS_ALPHATESTENABLE, true);
                this.SetRenderState(RS_ALPHAFUNC, CMP_GREATER);
                this.SetRenderState(RS_ALPHAREF, 127);
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, true);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_CULLMODE, CULL_CW);
                this.SetRenderState(RS_BLENDOP, BLENDOP_ADD);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_TRANSPARENT:
                this.SetRenderState(RS_CULLMODE, CULL_CW);
                this.SetRenderState(RS_ALPHABLENDENABLE, true);
                this.SetRenderState(RS_SRCBLEND, BLEND_SRCALPHA);
                this.SetRenderState(RS_DESTBLEND, BLEND_INVSRCALPHA);
                this.SetRenderState(RS_BLENDOP, BLENDOP_ADD);
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, false);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0); // -1.0
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_ADDITIVE:
                this.SetRenderState(RS_CULLMODE, CULL_NONE);
                this.SetRenderState(RS_ALPHABLENDENABLE, true);
                this.SetRenderState(RS_SRCBLEND, BLEND_ONE);
                this.SetRenderState(RS_DESTBLEND, BLEND_ONE);
                this.SetRenderState(RS_BLENDOP, BLENDOP_ADD);
                this.SetRenderState(RS_ZENABLE, true);
                this.SetRenderState(RS_ZWRITEENABLE, false);
                this.SetRenderState(RS_ZFUNC, CMP_LEQUAL);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_FULLSCREEN:
                this.SetRenderState(RS_ALPHABLENDENABLE, false);
                this.SetRenderState(RS_ALPHATESTENABLE, false);
                this.SetRenderState(RS_CULLMODE, CULL_NONE);
                this.SetRenderState(RS_ZENABLE, false);
                this.SetRenderState(RS_ZWRITEENABLE, false);
                this.SetRenderState(RS_ZFUNC, CMP_ALWAYS);
                this.SetRenderState(RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(RS_DEPTHBIAS, 0);
                this.SetRenderState(RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(RS_COLORWRITEENABLE, 0xf);
                break;

            case RM_DISTORTION: // Same as Fullscreen?
            case RM_DEPTH:
                // TODO: Implement
                return;

            default:
                return;
        }

        this._currentRenderMode = renderMode;
    }

    /**
     * Requests an animation frame
     * @param {Function} callback
     */
    RequestAnimationFrame(callback)
    {
        return this.xr
            ? this.xr.RequestAnimationFrame(callback)
            : this.constructor.RequestAnimationFrame(callback);
    }

    /**
     * Cancels an animation frame
     * @param {Number} id
     */
    CancelAnimationFrame(id)
    {
        return this.xr
            ? this.xr.CancelAnimationFrame(id)
            : this.constructor.CancelAnimationFrame(id);
    }


    /**
     * Creates a webgl context
     * @param params
     * @param canvas
     * @returns {null|WebGLRenderingContext|WebGL2RenderingContext}
     * @throws on invalid context
     */
    static CreateContext(params = {}, canvas)
    {
        if (isString(canvas))
        {
            canvas = document.getElementById(canvas);
        }

        if (!canvas)
        {
            canvas = document.createElement("canvas");
        }

        const contextTypes = params.webgl2 ? [ "webgl2" ] : [ "webgl", "experimental-webgl" ];

        let context = null;
        for (let contextType of contextTypes)
        {
            context = canvas.getContext(contextType, params);
            if (context) break;
        }

        if (!context)
        {
            throw new ErrWebglContext({ version: params.webgl2 ? 2 : 1 });
        }

        return context;
    }

    /**
     * Requests an animation frame
     * @type {Function}
     */
    static RequestAnimationFrame = (function()
    {
        const request = get(window, VendorRequestAnimationFrame);
        return callback => request(callback);
    })();

    /**
     * Cancels an animation frame
     * @type {Function}
     */
    static CancelAnimationFrame = (function()
    {
        const cancel = get(window, VendorCancelAnimationFrame);
        return id => cancel(id);
    })();

    /**
     * Finds an XR Device
     * @param {{}} [sessionOptions]
     * @returns {Promise<XRDevice>}
     */
    static async FindXRDevice(sessionOptions)
    {
        if (!navigator.xr)
        {
            throw new ErrWebxrNotSupported();
        }

        let device;
        try
        {
            device = await navigator.xr["requestDevice"]();
        }
        catch (err)
        {
            if (err.name === "NotFoundError" || err.message === "NotFoundError")
            {
                throw new ErrWebxrDeviceNotFound({ err: err.message });
            }

            throw new ErrWebxrRequestFailed({ err: err.message });
        }

        // Optionally pass session requirements
        if (sessionOptions)
        {
            try
            {
                await device["supportsSession"](sessionOptions);
            }
            catch (err)
            {
                throw new ErrWebxrSessionNotSupported({ err: err.message });
            }
        }

        return device;
    }

    /**
     * Logger category
     * @type {String}
     */
    static __category = "Device";

}

// Render Modes
Tw2Device.prototype.RM_ANY = RM_ANY;
Tw2Device.prototype.RM_OPAQUE = RM_OPAQUE;
Tw2Device.prototype.RM_DECAL = RM_DECAL;
Tw2Device.prototype.RM_TRANSPARENT = RM_TRANSPARENT;
Tw2Device.prototype.RM_ADDITIVE = RM_ADDITIVE;
Tw2Device.prototype.RM_DEPTH = RM_DEPTH;
Tw2Device.prototype.RM_DISTORTION = RM_DISTORTION;
Tw2Device.prototype.RM_FULLSCREEN = RM_FULLSCREEN;
Tw2Device.prototype.RM_PICKABLE = RM_PICKABLE;
