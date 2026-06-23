// WrappedClient.js

import * as math from "math";
import * as util from "utils";
import { meta } from "utils";
import { api } from "./api";
import { device, tw2 } from "global";
import { Tw2EventEmitter, Tw2TextureRes } from "core";
import { RotationGizmo } from "./RotationGizmo";
import { WrappedView } from "./WrappedView";
import { WrappedCustomRender } from "./WrappedCustomRender";
import { WrappedScene } from "./WrappedScene";
import {
    CameraOrbitControls,
    OrthoCamera,
    OrthographicCamera,
    OrbitControls,
    MapControls,
    PerspectiveCamera
} from "./camera";
import * as testCamera from "./WrappedOrbitCamera";
import {
    WrappedTestOrthoOrbitCamera,
    WrappedTestOrbitCamera
} from "./WrappedOrbitCamera";
import { WrappedTestCamera } from "./WrappedTestCamera";

let eveSof;

const { vec3, vec4, mat4 } = math;

/**
 * Client class
 */
export class WrappedClient extends Tw2EventEmitter
{
    scene = null;
    camera = null;
    post = null;
    math = math;
    util = util;
    sof = null;

    test = testCamera;

    options = {
        update: true,
        render: true,
        postEffects: true,
        depth: true,
        clearColor: math.vec4.fromValues(1, 1, 1, 1),
        colorMask: math.vec4.fromValues(0, 0, 0, 1),
        view: [ 0, 0, 1, 1 ],   // normalized
        testCamera: false
    };

    useViews = false;
    views = [];
    customPasses = [];

    useMultiView = false;

    /**
     * Reference to the tw2 library
     * @return {Tw2Library}
     */
    get tw2()
    {
        return tw2;
    }

    /**
     * Gets the current delta time
     * @return {*}
     */
    get dt()
    {
        return device.dt;
    }

    /**
     * Gets the current frame
     * @return {*}
     */
    get frame()
    {
        return device.frameCounter;
    }

    /**
     * Gets the 3d canvas
     * @return {*}
     */
    get canvas3d()
    {
        return device.canvas;
    }

    /**
     * Gets the 2d canvas
     * @return {*}
     */
    get canvas2d()
    {
        return device.canvas2d;
    }

    /**
     * Initializes the client
     * @param {Object} options
     * @returns {Scene|undefined}
     */
    async Initialize(options = {})
    {
        let { client, render, scene, camera, ...opt } = options;
        if (client) util.assignIfExists(this.options, client, Object.keys(this.options));
        if (!render) render = dt => this.Render(dt);
        await tw2.Initialize({ render, ...opt });

        // Force load the sof
        this.sof = tw2.eveSof;

        // Quick setup
        if (camera) await this.FetchCamera(camera);
        if (scene) await this.FetchScene(scene);

        return this;
    }

    static global = {
        projection: math.mat4.create(),
        view: math.mat4.create()
    };

    RenderPass(dt, ctx)
    {
        const {
            scene,
            camera,
            options,

            target = null,
            viewport = null, // normalized [x, y, w, h], TOP-LEFT origin (0..1)

            post = null,
            colorMask = [ 1, 1, 1, 1 ],

            clearColor = options?.clearColor ?? scene?.wrapped?.clearColor ?? null,
            environment = options?.environment ?? true,

            clear = { color:true, depth:true, stencil:true },

            updateScene = false,
            updateCamera = true
        } = ctx;

        if (!scene || !camera) return false;

        const gl = device.gl;

        // -----------------------------------------------------------------
        // Normalize + clamp viewport (expects [x,y,w,h] in 0..1, top-left)
        // -----------------------------------------------------------------
        const W = device.viewportWidth;
        const H = device.viewportHeight;

        let vx = 0, vy = 0, vw = 1, vh = 1;
        if (viewport)
        {
            vx = viewport[0] ?? 0;
            vy = viewport[1] ?? 0;
            vw = viewport[2] ?? 1;
            vh = viewport[3] ?? 1;
        }

        // Clamp to sane normalized range
        vx = Math.min(1, Math.max(0, vx));
        vy = Math.min(1, Math.max(0, vy));
        vw = Math.min(1, Math.max(0, vw));
        vh = Math.min(1, Math.max(0, vh));

        // Convert to pixels (UI top-left)
        const xPx = Math.floor(vx * W);
        const yTopPx = Math.floor(vy * H);
        const wPx = Math.max(1, Math.floor(vw * W));
        const hPx = Math.max(1, Math.floor(vh * H));

        // Convert to GL bottom-left (this is the key for correct placement)
        const yPx = Math.max(0, H - (yTopPx + hPx));

        // Optional: clip width/height to framebuffer bounds
        const x = Math.min(W, Math.max(0, xPx));
        const y = Math.min(H, Math.max(0, yPx));
        const w = Math.max(1, Math.min(W - x, wPx));
        const h = Math.max(1, Math.min(H - y, hPx));

        // ---- Target ----
        if (target)
        {
            target.Update(w, h, target.hasDepth);
            target.Set({
                clearColorBit: clear.color,
                clearDepthBit: clear.depth,
                clearStencilBit: clear.stencil,
                clearColor
            });
        }

        // ---- Camera / Scene update ----
        if (updateCamera)
        {
            camera.Update(dt);
            device.SetNearFar(camera.GetNearPlane(), camera.GetFarPlane());
        }

        if (updateScene)
        {
            scene.Update(dt);
        }

        if (post && post.Update)
        {
            post.Update(dt, scene);
        }

        // -----------------------------------------------------------------
        // SCISSOR: restrict clears + rendering to this view rect
        // -----------------------------------------------------------------
        const wasScissor = gl.isEnabled(gl.SCISSOR_TEST);
        if (!wasScissor) gl.enable(gl.SCISSOR_TEST);

        gl.scissor(x, y, w, h);

        // IMPORTANT: set viewport to match scissor rect
        tw2.SetViewport([ x, y, w, h ]);

        // ---- Render state ----
        tw2
            .SetOpaqueRenderStates()
            .SetProjectionMatrix(camera.GetProjection(WrappedClient.global.projection, w / h))
            .SetViewMatrix(camera.GetView(WrappedClient.global.view))
            .SetClearColor(scene.wrapped.clearColor)
            .SetDepth(true, "LEQUAL", 1.0);

        // Clear INSIDE scissor only
        tw2.ClearBufferBits(clear.color, clear.depth, clear.stencil);

        // Draw
        let prevEnvironment = scene.wrapped.visible.environment;
        scene.wrapped.visible.environment = environment;
        scene.Render(dt);
        scene.wrapped.visible.background = prevEnvironment;

        // Restore scissor state
        if (!wasScissor) gl.disable(gl.SCISSOR_TEST);

        if (target) target.Unset();

        return true;
    }


    _Render(dt)
    {
        if (this.useMultiView)
        {
            return this.RenderMultiView(dt);
        }

        const { scene, camera, post } = this;
        if (!scene || !camera) return false;

        this.EmitEvent("update", dt);

        // ---- Update ONCE ----
        camera.Update(dt);
        device.SetNearFar(camera.GetNearPlane(), camera.GetFarPlane());
        scene.Update(dt);

        if (post && post.Update)
        {
            post.Update(dt, scene);
        }

        // ---- Main view ----
        this.RenderPass(dt, {
            scene,
            camera,
            viewport: this.options.view, // normalized
            post,
            updateScene: false,
            updateCamera: false
        });

        // ---- Extra views ----
        for (const view of this.views)
        {
            this.RenderPass(dt, {
                scene,
                camera: view.camera,
                viewport: view.viewport, // normalized
                post,
                updateScene: false,
                updateCamera: true,
                environment: view.environment ?? true,
                clearColor: view.clearColor ?? null
            });
        }

        // ---- Offscreen / custom passes ----
        // NOTE: viewport is normalized. Target sizing is handled by target.Update(w,h,...) inside RenderPass.
        for (const pass of this.customPasses)
        {
            this.RenderPass(dt, {
                scene: pass.scene,
                camera: pass.camera,
                target: pass.target,
                viewport: [ 0, 0, 1, 1 ], // CHANGED: normalized full-target viewport
                post: pass.post ?? null,
                updateScene: pass.updateScene ?? false,
                updateCamera: pass.updateCamera ?? true,
                environment: pass.environment ?? true,
                clearColor: pass.clearColor ?? null
            });
        }

        return true;
    }

    Render(dt)
    {
        if (this.useViews) return this.RenderViews(dt);

        if (this.useMultiView)
        {
            return this.RenderMultiView(dt);
        }

        const { render, update, postEffects, colorMask, view, clearColor } = this.options;
        const { camera, scene, post } = this;

        if (update && scene)
        {
            this.EmitEvent("update", dt);

            if (camera) 
            {
                camera.Update(dt);
                device.SetNearFar(camera.GetNearPlane(), camera.GetFarPlane());
            }
            scene.Update(dt);
            if (post && post.Update) post.Update(dt, scene);

            if (render)
            {
                let x = view[0] * device.viewportWidth,
                    y = view[1] * device.viewportHeight,
                    w = view[2] * device.viewportWidth - x,
                    h = view[3] * device.viewportHeight - y;

                this.EmitEvent("pre_render", dt);

                tw2
                    .SetOpaqueRenderStates()
                    .SetProjectionMatrix(camera.GetProjection(WrappedClient.global.projection, w / h))
                    .SetViewMatrix(camera.GetView(WrappedClient.global.view))
                    .SetClearColor(scene.wrapped.clearColor)
                    .SetDepth(true, "LEQUAL", 1.0)
                    .ClearBufferBits(true, true, true)
                    .SetViewport([ x, y, w, h ]);


                this.EmitEvent("pre_scene_render", dt);
                scene.Render(dt);
                this.EmitEvent("post_scene_render", dt);

                this.EmitEvent("pre_post", dt);

                let didPost = false;
                if (post && post.Render(dt))
                {
                    didPost = true;
                }

                if (!didPost)
                {
                    tw2
                        .SetColorMask(colorMask)
                        .SetClearColor(clearColor)
                        .ClearBufferBits(true, true)
                        .SetColorMask([ 1, 1, 1, 1 ]);
                }

                this.EmitEvent("post_post", dt, didPost);
            }
        }

        if (this.postScenes)
        {
            for (let i = 0; i < this.postScenes.length; i++)
            {
                this.postScenes[i].Render(dt);
            }
        }

        this.EmitEvent("post_render", dt);


        if (this.customRenders)
        {
            for (let i = 0; i < this.customRenders.length; i++)
            {
                this.customRenders[i].Render(dt, this);
            }
        }

        return true;
    }

    /**
     * Fetches a texture from a url
     * @param {String} url
     * @return {Promise<WebglTexture>}
     */
    static async LoadTextureFromURL(url)
    {
        return new Promise((resolve, reject) =>
        {
            const { gl } = device;

            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            const
                internalFormat = gl.RGBA,
                srcFormat = gl.RGBA,
                srcType = gl.UNSIGNED_BYTE,
                pixel = new Uint8Array([ 0, 0, 0, 0 ]);

            // Temp black image
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, srcFormat, srcType, pixel);
            gl.bindTexture(gl.TEXTURE_2d, null);

            const image = new Image();

            image.onerror = err => reject(err);

            image.onload = function ()
            {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, srcFormat, srcType, image);

                if (Tw2TextureRes.isPowerOfTwo(image.width, image.height))
                {
                    gl.generateMipmap(gl.TEXTURE_2D);
                }
                else
                {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                }

                gl.bindTexture(gl.TEXTURE_2d, null);

                resolve(texture);
            };

            image.src = url;
        });
    }

    /**
     * Gets basic character info from a character id
     * @param {Number} character_id
     * @return {Promise<{alliance: *, allianceTexture: *, corporation: *, name: *, portrait: *, corporationTexture: *}>}
     */
    async FetchBasicCharacterData(character_id)
    {
        const character = await api.getCharacterID(character_id);
        const { corporation_id, alliance_id } = character;

        //  Default texture
        const px128x128 = tw2.GetURL("res:/texture/global/black.dds.0.png");

        const [ corporation, corporationIcons, alliance, allianceLogos, portraits ] = await Promise.all([
            api.getCorporationID(corporation_id),
            api.getCorporationLogos(corporation_id),
            alliance_id ? api.getAllianceID(alliance_id) : { name: "None" },
            alliance_id ? api.getAllianceLogos(alliance_id) : { px128x128 },
            api.getCharacterPortraits(character_id)
        ]);

        return {
            character: character.name,
            //portrait: await WrappedClient.LoadTextureFromURL(portraits.px512x512),
            corporation: corporation.name,
            //corporationTexture: await WrappedClient.LoadTextureFromURL(corporationIcons.px128x128),
            alliance: alliance.name,
            //allianceTexture: await WrappedClient.LoadTextureFromURL(allianceLogos.px128x128)
        };
    }

    async FetchCharacterID(characterID) { return api.getCharacterID(characterID); }
    async FetchCharacterPortraits(characterID) { return api.getCharacterPortraits(characterID); }
    async FetchCorporationID(corporationID) { return api.getCorporationID(corporationID); }
    async FetchCorporationLogos(corporationID) { return api.getCorporationLogos(corporationID); }
    async FetchAllianceID(allianceID) { return api.getAllianceID(allianceID); }
    async FetchAllianceLogos(allianceID) { return api.getAllianceLogos(allianceID); }
    async FetchSkinMaterialTypeIDs(skinMaterialID) { return api.getSkinMaterialTypeIDs(skinMaterialID); }
    async FetchTypeIDSkinIDs(typeID) { return api.getTypeIDSkinIDs(typeID); }
    async FetchSkinID(skinID) { return api.getSkinID(skinID); }
    async FetchTypeID(typeID) { return api.getTypeID(typeID); }
    async FetchGraphicID(graphicID) { return api.getGraphicID(graphicID); }
    async FetchResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID) { return api.getResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID); }
    async FetchResPathFromTypeIDAndSkinID(typeID, skinID) { return api.getResPathFromTypeIDAndSkinID(typeID, skinID); }
    async FetchResPathFromTypeID(typeID) { return api.getResPathFromTypeID(typeID); }
    async FetchResPathFromGraphicID(graphicID) { return api.getResPathFromGraphicID(graphicID); }

    async FetchSOF()
    {
        return WrappedClient.fetchEveSOF();
    }

    async FetchSOFHullPatterns(hull)
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetHullPatternNames(hull);
    }

    async FetchSOFHulls()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetHullNames([]);
    }

    async FetchSOFFactions()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetFactionNames([]);
    }

    async FetchSOFRaces()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetRaceNames([]);
    }

    async FetchSOFMaterials()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetMaterialNames([]);
    }

    async FetchScene(options, doNotAdd)
    {
        const scene = await WrappedScene.fetch(options);
        if (!doNotAdd) this.SetScene(scene);
        return scene;
    }

    async FetchView(options = {}, doNotAdd)
    {
        const camera = await this.FetchCamera(options, true);
        const view = new WrappedView(this.scene, camera, options.viewPort);
        if (!doNotAdd) this.views.push(view);
        return view;
    }

    async FetchCamera(options = {}, doNotAdd)
    {
        if (util.isString(options))
        {
            options = { canvas: options };
        }

        if (!options.canvas && options.canvas !== null)
        {
            options.canvas = this.canvas2d ? this.canvas2d : this.canvas3d;
        }

        const camera = this.options.testCamera
            ? await WrappedTestOrbitCamera.fetch(options)
            : await WrappedTestCamera.fetch(options);

        if (!doNotAdd) this.SetCamera(camera);
        return camera;
    }

    SetScene(scene)
    {
        if (this.scene !== scene)
        {
            if (this.scene) this.EmitEvent("scene_removed", this.scene);
            this.scene = scene;
            this.EmitEvent("scene_added", scene);
        }
        return this;
    }

    SetCamera(camera)
    {
        if (this.camera !== camera)
        {
            if (this.camera)
            {
                this.EmitEvent("camera_removed", this.camera);
                if (this.camera.controller) this.camera.controller.enabled = false;
            }

            this.camera = camera;
            if (camera.controller) camera.controller.enabled = true;
            this.EmitEvent("camera_added", camera);
        }
        return this;
    }

    async FetchSystemID(id)
    {
        return api.getSystemID(id);
    }

    static async fetchEveSOF()
    {
        return tw2.eveSof;
    }

    /* --------- vibe coding --------- */

    createVSMSample(size, farDepth, occluderDepth, blurRadius)
    {
        return this.constructor.createSampleVSMShadowMap(tw2.gl, {
            size,
            farDepth,
            occluderDepth,
            blurRadius
        });
    }

    static createSampleVSMShadowMap(gl, {
        size = 256,
        farDepth = 0.85,
        occluderDepth = 0.30,
        occluder = { cx: 0.5, cy: 0.45, r: 0.18 }, // normalized [0..1]
        blurRadius = 6,                             // pixels, box blur
        varianceEpsilon = 1e-6                      // keep variance >= eps
    } = {})
    {

        if (!(gl instanceof WebGL2RenderingContext))
        {
            throw new Error("This sample expects WebGL2 for RG16F/RG32F textures.");
        }

        function boxBlurMomentsRGBA(srcRGBA, w, h, radius)
        {
            const tmp = new Float32Array(srcRGBA.length);
            const dst = new Float32Array(srcRGBA.length);

            // Horizontal
            for (let y = 0; y < h; y++)
            {
                for (let x = 0; x < w; x++)
                {
                    let sumR = 0, sumG = 0;
                    let count = 0;
                    for (let k = -radius; k <= radius; k++)
                    {
                        const xx = Math.min(w - 1, Math.max(0, x + k));
                        const i = (y * w + xx) * 4;
                        sumR += srcRGBA[i + 0];
                        sumG += srcRGBA[i + 1];
                        count++;
                    }
                    const o = (y * w + x) * 4;
                    tmp[o + 0] = sumR / count;
                    tmp[o + 1] = sumG / count;
                    tmp[o + 2] = 0;
                    tmp[o + 3] = 1;
                }
            }

            // Vertical
            for (let y = 0; y < h; y++)
            {
                for (let x = 0; x < w; x++)
                {
                    let sumR = 0, sumG = 0;
                    let count = 0;
                    for (let k = -radius; k <= radius; k++)
                    {
                        const yy = Math.min(h - 1, Math.max(0, y + k));
                        const i = (yy * w + x) * 4;
                        sumR += tmp[i + 0];
                        sumG += tmp[i + 1];
                        count++;
                    }
                    const o = (y * w + x) * 4;
                    dst[o + 0] = sumR / count;
                    dst[o + 1] = sumG / count;
                    dst[o + 2] = 0;
                    dst[o + 3] = 1;
                }
            }

            return dst;
        }

        // --- 1) Build base depth field z(x,y) in [0..1] ---
        const z = new Float32Array(size * size);
        for (let y = 0; y < size; y++)
        {
            for (let x = 0; x < size; x++)
            {
                const u = (x + 0.5) / size;
                const v = (y + 0.5) / size;

                const dx = u - occluder.cx;
                const dy = v - occluder.cy;
                const inside = (dx * dx + dy * dy) <= (occluder.r * occluder.r);

                // Simple: near occluder, far background
                z[y * size + x] = inside ? occluderDepth : farDepth;
            }
        }

        // --- 2) Convert to moments: m1 = z, m2 = z^2 ---
        let moments = new Float32Array(size * size * 4);
        for (let i = 0; i < size * size; i++)
        {
            const m1 = z[i];
            const m2 = m1 * m1;
            moments[i * 4 + 0] = m1;
            moments[i * 4 + 1] = m2;
            moments[i * 4 + 2] = 0.0;
            moments[i * 4 + 3] = 1.0;
        }

        // --- 3) Blur moments ---
        if (blurRadius > 0)
        {
            moments = boxBlurMomentsRGBA(moments, size, size, blurRadius);
        }

        // --- 4) Ensure variance isn't negative ---
        for (let i = 0; i < size * size; i++)
        {
            const m1 = moments[i * 4 + 0];
            let m2 = moments[i * 4 + 1];
            const var0 = m2 - m1 * m1;
            if (var0 < varianceEpsilon)
            {
                m2 = m1 * m1 + varianceEpsilon;
                moments[i * 4 + 1] = m2;
            }
        }

        // --- 5) Upload as a float texture ---
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        const internalFormat = gl.RG16F;
        const format = gl.RG;
        const type = gl.FLOAT;

        const momentsRG = new Float32Array(size * size * 2);
        for (let i = 0; i < size * size; i++)
        {
            momentsRG[i * 2 + 0] = moments[i * 4 + 0];
            momentsRG[i * 2 + 1] = moments[i * 4 + 1];
        }

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            internalFormat,
            size,
            size,
            0,
            format,
            type,
            momentsRG
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return { texture: tex, size };
    }

    /**
     * Creates/refreshes the editor ortho view cameras as 4 WrappedView instances:
     * [0]=Front, [1]=Back, [2]=Left, [3]=Right
     */
    SetupEditorOrthoViews()
    {
        this.editorOrtho = this.editorOrtho || {
            front: new WrappedTestOrthoOrbitCamera().Front(),
            back:  new WrappedTestOrthoOrbitCamera().Back(),
            left:  new WrappedTestOrthoOrbitCamera().Left(),
            right: new WrappedTestOrthoOrbitCamera().Right()
        };

        this.editorOrtho.front.allowOrbit = false;
        this.editorOrtho.back.allowOrbit = false;
        this.editorOrtho.left.allowOrbit = false;
        this.editorOrtho.right.allowOrbit = false;

        this.views.length = 0;

        // viewports are normalized (we’ll assign them in RenderMultiView)
        this.views.push(new WrappedView(this.scene, this.editorOrtho.front, [ 0,0,0,0 ]));
        this.views.push(new WrappedView(this.scene, this.editorOrtho.back,  [ 0,0,0,0 ]));
        this.views.push(new WrappedView(this.scene, this.editorOrtho.left,  [ 0,0,0,0 ]));
        this.views.push(new WrappedView(this.scene, this.editorOrtho.right, [ 0,0,0,0 ]));

        // Enable multiview input
        this.EnableEditorOrthoInput(this.canvas2d);

        // Start fitted
        this.AutoFitOrthoViews(null, true);
    }

    lockOrthoZoomToMain = false;

    /**
     * Multi-view layout:
     * [ front, back ]
     * [    main     ]
     * [ left, right ]
     */
    RenderMultiView(dt)
    {
        const { scene, camera, post } = this;
        if (!scene || !camera) return false;

        this.EmitEvent("update", dt);

        // --- Update once per frame ---
        camera.Update(dt);
        device.SetNearFar(camera.GetNearPlane(), camera.GetFarPlane());
        scene.Update(dt);

        if (this.lockOrthoZoomToMain) this._syncOrthoPoiOnly();

        if (post && post.Update) post.Update(dt, scene);

        // Ensure 4 ortho views exist
        if (!this.views || this.views.length !== 4 || !this.views[0]?.camera)
        {
            this.SetupEditorOrthoViews();
        }

        // --- Layout in pixels (we convert to normalized after) ---
        const W = device.viewportWidth;
        const H = device.viewportHeight;

        /*
        const margin = Math.floor(Math.min(W, H) * 0.02);
        const rowH   = Math.floor((H - margin * 3) * 0.22);
        const midH   = H - (rowH * 2) - (margin * 2);
        const colW   = Math.floor((W - margin * 3) * 0.5);

        const vpFrontPx = [ margin,            margin,            colW, rowH ];
        const vpBackPx  = [ margin * 2 + colW, margin,            colW, rowH ];
        const vpMainPx  = [ margin,            margin * 2 + rowH, W - margin * 2, midH ];
        const vpLeftPx  = [ margin,            margin * 3 + rowH + midH, colW, rowH ];
        const vpRightPx = [ margin * 2 + colW, margin * 3 + rowH + midH, colW, rowH ];
         */

        // ------------------------------------------------------------
        // Zero-gap layout (pixel perfect)
        // [ front | back ]
        // [      main     ]
        // [ left  | right ]
        // ------------------------------------------------------------

        const topH    = Math.floor(H * 0.22);
        const bottomH = topH;
        const midH    = H - topH - bottomH;
        // Split width exactly
        const leftW  = Math.floor(W * 0.5);
        const rightW = W - leftW;
        // Top row
        const vpFrontPx = [ 0,        0,        leftW,  topH ];
        const vpBackPx  = [ leftW,   0,        rightW, topH ];
        // Middle (main)
        const vpMainPx  = [ 0,        topH,     W,      midH ];
        // Bottom row
        const vpLeftPx  = [ 0,        topH + midH, leftW,  bottomH ];
        const vpRightPx = [ leftW,   topH + midH, rightW, bottomH ];

        // -------------------------------
        // CHANGED: Convert pixel rects to normalized viewports (0..1)
        // -------------------------------
        const invW = 1 / W;
        const invH = 1 / H;

        const pxTo01 = (out, rPx) =>
        {
            out[0] = rPx[0] * invW;
            out[1] = rPx[1] * invH;
            out[2] = rPx[2] * invW;
            out[3] = rPx[3] * invH;
            return out;
        };

        // Assign viewports (normalized)
        // views[0]=front, [1]=back, [2]=left, [3]=right
        pxTo01(this.views[0].viewport, vpFrontPx);
        pxTo01(this.views[1].viewport, vpBackPx);
        pxTo01(this.views[2].viewport, vpLeftPx);
        pxTo01(this.views[3].viewport, vpRightPx);

        // Main viewport (normalized) for the main camera pass
        const vpMain01 = [
            vpMainPx[0] * invW,
            vpMainPx[1] * invH,
            vpMainPx[2] * invW,
            vpMainPx[3] * invH
        ];

        // OPTIONAL: if you want "lock ortho zoom to main camera distance"
        if (this.lockOrthoZoomToMain)
        {
            const sharedOrthoHeight = Math.max(0.01, camera.distance * 1.0); // tune
            for (let i = 0; i < 4; i++)
            {
                const cam = this.views[i].camera;
                if (typeof cam.orthoHeight === "number") cam.orthoHeight = sharedOrthoHeight;
            }
        }

        // --- Render main ---
        this.RenderPass(dt, {
            scene,
            camera,
            viewport: vpMain01, // CHANGED: normalized
            post,
            updateScene: false,
            updateCamera: false
        });

        // --- Render 4 ortho views ---
        for (let i = 0; i < 4; i++)
        {
            const v = this.views[i];
            this.RenderPass(dt, {
                scene,
                camera: v.camera,
                viewport: v.viewport, // normalized
                post,
                updateScene: false,
                updateCamera: true,
                environment: v.environment ?? true,
                clearColor: v.clearColor ?? null
            });
        }

        return true;
    }

    // ------------------------------------------------------------
    // Multi-view input (ortho zoom + fit)
    // Uses WrappedTestOrthoOrbitCamera API: zoomVel, GetZoomScale(), SetFitDistance()
    // Viewports: normalized [x,y,w,h] TOP-LEFT
    // ------------------------------------------------------------

    _editorInput = null;

    GetSceneBoundsFromObjects(fallbackRadius = 10)
    {
        const scene = this.scene;
        const outCenter = vec3.alloc();
        const tmpCenter = vec3.alloc();

        const objects = scene?.wrapped?.objects;
        if (!objects || !objects.length)
        {
            vec3.copy(outCenter, this.camera?.poi ?? [ 0, 0, 0 ]);
            vec3.unalloc(tmpCenter);
            return { center: outCenter, radius: fallbackRadius };
        }

        let hasAny = false;
        let aggRadius = 0;

        for (let i = 0; i < objects.length; i++)
        {
            const obj = objects[i];
            const w = obj?.wrapped;
            if (!w) continue;

            if (!w.GetBoundingSphereRadius || !w.GetBoundingSphereCenter) continue;

            const r = w.GetBoundingSphereRadius();
            if (!Number.isFinite(r) || r <= 0) continue;

            w.GetBoundingSphereCenter(tmpCenter);

            if (!hasAny)
            {
                vec3.copy(outCenter, tmpCenter);
                aggRadius = r;
                hasAny = true;
                continue;
            }

            const d = vec3.distance(outCenter, tmpCenter);

            // Existing sphere fully contains new
            if (d + r <= aggRadius) continue;

            // New sphere fully contains existing
            if (d + aggRadius <= r)
            {
                vec3.copy(outCenter, tmpCenter);
                aggRadius = r;
                continue;
            }

            // Expand sphere
            const newRadius = (aggRadius + d + r) * 0.5;
            const t = (newRadius - aggRadius) / d;

            outCenter[0] += (tmpCenter[0] - outCenter[0]) * t;
            outCenter[1] += (tmpCenter[1] - outCenter[1]) * t;
            outCenter[2] += (tmpCenter[2] - outCenter[2]) * t;

            aggRadius = newRadius;
        }

        if (!hasAny)
        {
            vec3.copy(outCenter, this.camera?.poi ?? [ 0, 0, 0 ]);
            aggRadius = fallbackRadius;
        }

        vec3.unalloc(tmpCenter);
        return { center: outCenter, radius: aggRadius };
    }

    GetCanvasNormalizedXY(e, canvas = this.canvas3d)
    {
        const r = canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;   // 0..1 left->right
        const ny = (e.clientY - r.top) / r.height;   // 0..1 top->bottom
        return [ nx, ny ];
    }

    FindEditorOrthoViewAt(nx, ny)
    {
        if (!this.useMultiView || !this.views || this.views.length < 4) return null;

        for (let i = 0; i < 4; i++)
        {
            const v = this.views[i];
            const vp = v?.viewport;
            if (!vp) continue;

            const x = vp[0], y = vp[1], w = vp[2], h = vp[3];
            if (nx >= x && nx <= x + w && ny >= y && ny <= y + h) return v;
        }

        return null;
    }

    IsOrthoOrbitCamera(cam)
    {
        return !!cam && typeof cam.orthoHeight === "number" && typeof cam.SetFitDistance === "function";
    }

    ZoomOrthoCameraImmediate(cam, wheelDir, opts = {})
    {
        // wheelDir: +1 => wheel down, -1 => wheel up (like Math.sign(deltaY))
        const {
            multiplier = 1.0,          // overall sensitivity
            min = cam.minOrthoHeight ?? 0.01,
            max = cam.maxOrthoHeight ?? 1e9
        } = opts;

        if (!this.IsOrthoOrbitCamera(cam)) return false;

        // Match your controller logic, but apply immediately (no dt dependency):
        // camera.zoomVel += delta * camera.GetZoomScale()
        // then Update does orthoHeight += zoomVel * dt
        //
        // For editor UI, immediate is nicer and deterministic, so:
        const step = cam.GetZoomScale() * multiplier;
        cam.orthoHeight += wheelDir * step;

        cam.orthoHeight = Math.max(min, Math.min(max, cam.orthoHeight));
        return true;
    }

    ZoomOrthoViewAtWheel(view, wheelDir, all = false, opts = {})
    {
        if (!this.views || this.views.length < 4) return false;

        if (all)
        {
            for (let i = 0; i < 4; i++)
            {
                const cam = this.views[i]?.camera;
                if (cam) this.ZoomOrthoCameraImmediate(cam, wheelDir, opts);
            }
            return true;
        }

        const cam = view?.camera;
        return cam ? this.ZoomOrthoCameraImmediate(cam, wheelDir, opts) : false;
    }

    /**
     * Gathers the scene objects and gets a "scene bounding sphere radius"
     * @param fallback
     * @returns {Number|number|*}
     * @constructor
     */
    GetSceneFitRadius(fallback = 10)
    {
        const s = this.scene;

        // Try likely bounds sources
        const r1 = s?.wrapped?.boundingSphere?.radius;
        if (Number.isFinite(r1) && r1 > 0) return r1;

        const r2 = s?.wrapped?.bounds?.radius;
        if (Number.isFinite(r2) && r2 > 0) return r2;

        if (typeof s?.GetBoundingSphereRadius === "function")
        {
            const r3 = s.GetBoundingSphereRadius();
            if (Number.isFinite(r3) && r3 > 0) return r3;
        }

        return fallback;
    }

    /**
     * Autofits orthographic cameras based on the current scene
     * @param cam
     * @param radius
     * @param padding
     * @returns {boolean}
     * @constructor
     */
    AutoFitOrthoCamera(cam, radius, padding = 1.15)
    {
        if (!this.IsOrthoOrbitCamera(cam)) return false;
        cam.SetFitDistance(radius * padding);
        cam.zoomVel = 0; // stop inertia if present
        return true;
    }

    /**
     * Tries to fit orthographic views to the current poi
     * @param view
     * @param all
     * @param opts
     * @returns {boolean}
     * @constructor
     */
    AutoFitOrthoViews(view = null, all = false, opts = {})
    {
        const { padding = 1.15, radius = null, center = null } = opts;

        let r = radius;
        let c = center;

        if (r == null || c == null)
        {
            const bounds = this.GetSceneBoundsFromObjects();
            r = bounds.radius;
            c = bounds.center;
        }

        if (all || !view)
        {
            for (let i = 0; i < this.views.length; i++)
            {
                const cam = this.views[i]?.camera;
                if (!cam) continue;

                vec3.copy(cam.poi, c);
                this.AutoFitOrthoCamera(cam, r, padding);
            }
        }
        else
        {
            const cam = view.camera;
            vec3.copy(cam.poi, c);
            this.AutoFitOrthoCamera(cam, r, padding);
        }

        return true;
    }

    /**
     * Enables editor ortho cameras
     * @param {HTMLCanvasElement} canvas=this.canvas2d
     * @constructor
     */
    EnableEditorOrthoInput(canvas = this.canvas2d)
    {
        this.DisableEditorOrthoInput();

        const onWheel = (e) =>
        {
            if (!this.useMultiView) return;

            const [ nx, ny ] = this.GetCanvasNormalizedXY(e, canvas);
            const view = this.FindEditorOrthoViewAt(nx, ny);
            if (!view) return;

            e.preventDefault();

            // deltaY: +down (zoom out), -up (zoom in)
            const wheelDir = Math.sign(e.deltaY);

            // Modifiers: Shift or Ctrl => zoom all ortho views
            const zoomAll = e.shiftKey || e.ctrlKey;

            // Optional: Alt for "fine" zoom
            const multiplier = e.altKey ? 0.25 : 1.0;

            this.ZoomOrthoViewAtWheel(view, wheelDir, zoomAll, { multiplier });
        };

        const onDblClick = (e) =>
        {
            if (!this.useMultiView) return;

            const [ nx, ny ] = this.GetCanvasNormalizedXY(e, canvas);
            const view = this.FindEditorOrthoViewAt(nx, ny);
            if (!view) return;

            e.preventDefault();

            const fitAll = e.shiftKey || e.ctrlKey;
            this.AutoFitOrthoViews(view, fitAll);
        };

        const onKeyDown = (e) =>
        {
            if (!this.useMultiView) return;

            // "F" to fit all ortho views
            if (e.key === "f" || e.key === "F")
            {
                this.AutoFitOrthoViews(null, true);
            }
        };

        canvas.addEventListener("wheel", onWheel, { passive: false });
        canvas.addEventListener("dblclick", onDblClick, false);
        window.addEventListener("keydown", onKeyDown, false);

        this._editorInput = { canvas, onWheel, onDblClick, onKeyDown };
    }

    DisableEditorOrthoInput()
    {
        const h = this._editorInput;
        if (!h) return;

        h.canvas.removeEventListener("wheel", h.onWheel);
        h.canvas.removeEventListener("dblclick", h.onDblClick);
        window.removeEventListener("keydown", h.onKeyDown);

        this._editorInput = null;
    }

    _syncOrthoPoiOnly()
    {
        if (!this.views || this.views.length < 4) return;

        const mainPoi = this.camera?.poi;
        if (!mainPoi) return;

        // Keep last POI to avoid doing this every frame (optional)
        const last = (this._lastMainPoi ??= vec3.create());
        if (vec3.sqrDist(last, mainPoi) < 1e-12) return;

        vec3.copy(last, mainPoi);

        for (let i = 0; i < 4; i++)
        {
            const cam = this.views[i]?.camera;
            if (!cam) continue;

            // POI only
            vec3.copy(cam.poi, mainPoi);

            // DO NOT TOUCH:
            // cam.rotationX / cam.rotationY (view orientation)
            // cam.orthoHeight (zoom)
            // cam.panVel, yawVel, pitchVel, zoomVel
        }
    }
}


WrappedClient.prototype.CameraOrbitControls = CameraOrbitControls;
WrappedClient.prototype.OrthoCamera = OrthoCamera;
WrappedClient.prototype.OrthographicCamera = OrthographicCamera;
WrappedClient.prototype.PerspectiveCamera = PerspectiveCamera;
WrappedClient.prototype.RotationGizmo = RotationGizmo;
WrappedClient.prototype.OrbitControls = OrbitControls;
WrappedClient.prototype.MapControls = MapControls;
WrappedClient.prototype.WrappedTestCamera = WrappedTestCamera;
WrappedClient.prototype.WrappedCustomRender = WrappedCustomRender;
WrappedClient.prototype.WrappedTestOrbitCamera = WrappedTestOrbitCamera;


// ------------------------------------------------------------
// WrappedOrthoCamera (in same file for now)
// ------------------------------------------------------------
@meta.type("WrappedOrthoCamera")
export class WrappedOrthoCamera extends meta.Model
{
    @meta.vector3 poi = vec3.create();

    @meta.float size = 10;            // half-height in world units
    @meta.float nearPlane = -1e6;
    @meta.float farPlane  =  1e6;

    direction = vec3.fromValues(0, 0, -1);
    up        = vec3.fromValues(0, 1,  0);

    _view = mat4.create();
    _world = mat4.create();
    _aspect = 1;

    // ---- interface ----
    GetNearPlane() { return this.nearPlane; }
    GetFarPlane()  { return this.farPlane; }

    GetView(out) { return mat4.copy(out, this._view); }

    GetProjection(out, aspect)
    {
        this._aspect = aspect;
        const h = this.size;
        const w = h * aspect;
        return mat4.ortho(out, -w, w, -h, h, this.nearPlane, this.farPlane);
    }

    Update()
    {
        // For ortho, distance doesn’t matter, but a larger offset keeps lookAt stable.
        const eye = vec3.alloc();
        vec3.scaleAndAdd(eye, this.poi, this.direction, -1000);

        mat4.lookAt(this._view, eye, this.poi, this.up);
        mat4.invert(this._world, this._view);

        vec3.unalloc(eye);
    }

    // ---- helpers ----
    SetDirection(dir, up)
    {
        vec3.normalize(this.direction, dir);
        if (up) vec3.normalize(this.up, up);
        return this;
    }

    FocusRadius(radius, multiplier = 1)
    {
        this.size = Math.max(0.001, radius * multiplier);
        return this;
    }

    // ---- presets ----
    Front()  { return this.SetDirection([ 0, 0, -1 ], [ 0, 1, 0 ]); }
    Back()   { return this.SetDirection([ 0, 0,  1 ], [ 0, 1, 0 ]); }
    Left()   { return this.SetDirection([ 1, 0,  0 ], [ 0, 1, 0 ]); }
    Right()  { return this.SetDirection([ -1, 0, 0 ], [ 0, 1, 0 ]); }
    Top()    { return this.SetDirection([ 0, -1, 0 ], [ 0, 0, -1 ]); }
    Bottom() { return this.SetDirection([ 0,  1, 0 ], [ 0, 0,  1 ]); }

    static isCamera = true;
}


