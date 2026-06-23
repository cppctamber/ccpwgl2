import * as math from "math";
import * as util from "utils";
import { api } from "./api";
import { RotationGizmo } from "./RotationGizmo";
import { WrappedView } from "./WrappedView";
import { WrappedCustomRender } from "./WrappedCustomRender";

let eveSof;

const {vec3, vec4, mat4} = math;

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

    options = {
        update: true,
        render: true,
        postEffects: true,
        depth: true,
        clearColor: math.vec4.fromValues(1, 1, 1, 1),
        colorMask: math.vec4.fromValues(0, 0, 0, 1),
        view: [ 0, 0, 1, 1 ],
        testCamera: true
    };

    useViews = false;
    views = [];
    customRenders = [];

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

            target = null,
            viewport = null, // [x, y, w, h] normalized (0..1)

            post = null,
            colorMask = [1, 1, 1, 1],
            clearColor = null,

            clear = { color:true, depth:true, stencil:true },

            updateScene = false,
            updateCamera = true
        } = ctx;

        if (!scene || !camera) return false;

        // --- Resolve normalized viewport -> pixels (ONLY HERE) ---
        const W = device.viewportWidth;
        const H = device.viewportHeight;

        const vx = viewport ? viewport[0] : 0;
        const vy = viewport ? viewport[1] : 0;
        const vw = viewport ? viewport[2] : 1;
        const vh = viewport ? viewport[3] : 1;

        const x = Math.floor(vx * W);
        const y = Math.floor(vy * H);
        const w = Math.floor(vw * W);
        const h = Math.floor(vh * H);

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

        // ---- Scene render ----
        tw2
            .SetOpaqueRenderStates()
            .SetProjectionMatrix(camera.GetProjection(WrappedClient.global.projection, w / h))
            .SetViewMatrix(camera.GetView(WrappedClient.global.view))
            .SetClearColor(scene.wrapped.clearColor)
            .SetDepth(true, "LEQUAL", 1.0)
            .ClearBufferBits(clear.color, clear.depth, clear.stencil)
            .SetViewport([ x, y, w, h ]);

        scene.Render(dt);

        // ---- Post (per-view) ----
        let didPost = false;
        if (post) didPost = !!post.Render(dt);

        if (!didPost)
        {
            tw2
                .SetColorMask(colorMask)
                .SetClearColor(clearColor)
                .ClearBufferBits(true, true)
                .SetColorMask([1, 1, 1, 1]);
        }

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
            viewport: this.options.view,
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
                viewport: view.viewport,
                post,
                updateScene: false,
                updateCamera: true
            });
        }

        // ---- Offscreen / custom passes ----
        for (const pass of this.customPasses)
        {
            this.RenderPass(dt, {
                scene: pass.scene,
                camera: pass.camera,
                target: pass.target,
                viewport: [0, 0, pass.width, pass.height],
                post: pass.post ?? null,
                updateScene: pass.updateScene ?? false,
                updateCamera: pass.updateCamera ?? true
            });
        }

        return true;
    }


    Render(dt)
    {
        if (this.useViews) return this.RenderViews(dt);

        const { render, update, postEffects, colorMask, view, clearColor } = this.options;
        const { camera, scene, post } = this;

        if (update && scene)
        {
            this.EmitEvent("update", dt);

            if (camera) {
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

    /**
     *
     * @param {Number} characterID
     * @return {Promise<Object>}
     */
    async FetchCharacterID(characterID)
    {
        return api.getCharacterID(characterID);
    }

    /**
     *
     * @param {Number} characterID
     * @return {Promise<Object>}
     */
    async FetchCharacterPortraits(characterID)
    {
        return api.getCharacterPortraits(characterID);
    }

    /**
     *
     * @param {Number} corporationID
     * @return {Promise<Object>}
     */
    async FetchCorporationID(corporationID)
    {
        return api.getCorporationID(corporationID);
    }

    /**
     *
     * @param {Number} corporationID
     * @return {Promise<Object>}
     */
    async FetchCorporationLogos(corporationID)
    {
        return api.getCorporationLogos(corporationID);
    }

    /**
     *
     * @param {Number} allianceID
     * @return {Promise<Object>}
     */
    async FetchAllianceID(allianceID)
    {
        return api.getAllianceID(allianceID);
    }

    /**
     *
     * @param {Number} allianceID
     * @return {Promise<Object>}
     */
    async FetchAllianceLogos(allianceID)
    {
        return api.getAllianceLogos(allianceID);
    }

    /**
     * Fetches all type ids for a skin material ID
     * @param {String} skinMaterialID
     * @return {Promise<Array>}
     */
    async FetchSkinMaterialTypeIDs(skinMaterialID)
    {
        return api.getSkinMaterialTypeIDs(skinMaterialID);
    }

    /**
     * Fetches all skin ids for a type
     * @param {Number} typeID
     * @return {Promise<Array>}
     */
    async FetchTypeIDSkinIDs(typeID)
    {
        return api.getTypeIDSkinIDs(typeID);
    }

    /**
     *
     * @param skinID
     * @return {Promise<*>}
     */
    async FetchSkinID(skinID)
    {
        return api.getSkinID(skinID);
    }

    /**
     *
     * @param typeID
     * @return {Promise<Object>}
     */
    async FetchTypeID(typeID)
    {
        return api.getTypeID(typeID);
    }

    /**
     *
     * @param graphicID
     * @return {Promise<Object>}
     */
    async FetchGraphicID(graphicID)
    {
        return api.getGraphicID(graphicID);
    }

    /**
     *
     * @param typeID
     * @param skinMaterialID
     * @return {Promise<{dna: string, name: *}>}
     */
    async FetchResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID)
    {
        return api.getResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID);
    }

    /**
     *
     * @param typeID
     * @param skinID
     * @return {Promise<{dna: string, name: *}>}
     */
    async FetchResPathFromTypeIDAndSkinID(typeID, skinID)
    {
        return api.getResPathFromTypeIDAndSkinID(typeID, skinID);
    }

    /**
     *
     * @param typeID
     * @return {Promise<String>}
     */
    async FetchResPathFromTypeID(typeID)
    {
        return api.getResPathFromTypeID(typeID);
    }

    /**
     *
     * @param graphicID
     * @return {Promise<String>}
     */
    async FetchResPathFromGraphicID(graphicID)
    {
        return api.getResPathFromGraphicID(graphicID);
    }

    /**
     * Fetches the  space  object factory
     * @return {Promise<EveSOFData>}
     */
    async FetchSOF()
    {
        return WrappedClient.fetchEveSOF();
    }

    /**
     * Fetches sof pattern names for a given hull;
     * @param {String} hull
     * @return {Promise<Array>}
     */
    async FetchSOFHullPatterns(hull)
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetHullPatternNames(hull);
    }

    /**
     * Fetches sof hull names
     * @return {Promise<Array>}
     */
    async FetchSOFHulls()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetHullNames([]);
    }

    /**
     * Fetches sof faction names
     * @return {Promise<Array>}
     */
    async FetchSOFFactions()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetFactionNames([]);
    }

    /**
     * Fetches sof race names
     * @return {Promise<Array>}
     */
    async FetchSOFRaces()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetRaceNames([]);
    }

    /**
     * Fetches sof material names
     * @return {Promise<Array>}
     */
    async FetchSOFMaterials()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetMaterialNames([]);
    }

    /**
     * Fetches a scene async
     * @param {Object} options
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedScene>}
     */
    async FetchScene(options, doNotAdd)
    {
        const scene = await WrappedScene.fetch(options);
        if (!doNotAdd) this.SetScene(scene);
        return scene;
    }

    /**
     * Fetches a view async
     * @param options
     * @returns {Promise<void>}
     */
    async FetchView(options = {}, doNotAdd)
    {
        const camera = await this.FetchCamera(options, true);
        const view = new WrappedView(this.scene, camera, options.viewPort);
        if (!doNotAdd) this.views.push(view);
        return view;
    }

    /**
     * Fetches a camera async
     * @param {Object} [options={}]
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedCamera>}
     */
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

        const camera = this.options.testCamera ? await WrappedTestCamera.fetch(options) : await WrappedCamera.fetch(options);
        if (!doNotAdd) this.SetCamera(camera);
        return camera;
    }

    /**
     * Sets the current scene
     * @param {WrappedScene} scene
     * @return {WrappedClient}
     */
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

    /**
     * Sets the current camera
     * @param {WrappedCamera} camera
     * @return {WrappedClient}
     */
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

    /**
     * Fetches the latest eve sof
     * @return {Promise<EveSOFData>}
     */
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

    /**
     * Create a sample VSM shadow map (moments) texture.
     * R = mean depth (E[z])
     * G = mean depth^2 (E[z^2])
     *
     * Works in WebGL2 (recommended). For WebGL1 you'd need float texture extensions.
     */
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
        // Store in RG (2 channels) inside an RGBA float array (texImage2D wants 4 comps)
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

        // --- 3) Blur moments (VSM expects filtering on moments, not on depth) ---
        // Simple separable box blur on RG
        if (blurRadius > 0)
        {
            moments = boxBlurMomentsRGBA(moments, size, size, blurRadius);
        }

        // --- 4) Ensure variance isn't negative (numerical), and add small epsilon ---
        // variance = m2 - m1^2
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

        // Pick one:
        // - RG16F: smaller, usually supported
        // - RG32F: highest precision, but may be heavier
        const internalFormat = gl.RG16F;
        const format = gl.RG;
        const type = gl.FLOAT;

        // WebGL2 lets you supply RG from an RGBA array too, but it’s cleanest to pack RG only.
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

        // Filtering: VSM relies on linear filtering / blurring of moments
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
            front: new WrappedOrthoCamera().Front(),
            back:  new WrappedOrthoCamera().Back(),
            left:  new WrappedOrthoCamera().Left(),
            right: new WrappedOrthoCamera().Right()
        };

        this.views.length = 0;

        // viewport pixels are assigned each frame in RenderMultiView
        this.views.push(new WrappedView(this.scene, this.editorOrtho.front, [0,0,0,0]));
        this.views.push(new WrappedView(this.scene, this.editorOrtho.back,  [0,0,0,0]));
        this.views.push(new WrappedView(this.scene, this.editorOrtho.left,  [0,0,0,0]));
        this.views.push(new WrappedView(this.scene, this.editorOrtho.right, [0,0,0,0]));
    }

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

        if (post && post.Update) post.Update(dt, scene);

        // Ensure 4 ortho views exist
        if (!this.views || this.views.length !== 4 || !this.views[0]?.camera)
        {
            this.SetupEditorOrthoViews();
        }

        // --- Layout in pixels ---
        const W = device.viewportWidth;
        const H = device.viewportHeight;

        const margin = Math.floor(Math.min(W, H) * 0.02);
        const rowH   = Math.floor((H - margin * 3) * 0.22);
        const midH   = H - (rowH * 2) - (margin * 2);
        const colW   = Math.floor((W - margin * 3) * 0.5);

        const vpFront = [ margin,            margin,            colW, rowH ];
        const vpBack  = [ margin * 2 + colW, margin,            colW, rowH ];
        const vpMain  = [ margin,            margin * 2 + rowH, W - margin * 2, midH ];
        const vpLeft  = [ margin,            margin * 3 + rowH + midH, colW, rowH ];
        const vpRight = [ margin * 2 + colW, margin * 3 + rowH + midH, colW, rowH ];

        // Assign viewports
        // views[0]=front, [1]=back, [2]=left, [3]=right
        vec4.copy(this.views[0].viewport,vpFront);
        vec4.copy(this.views[1].viewport,vpBack);
        vec4.copy(this.views[2].viewport,vpLeft);
        vec4.copy(this.views[3].viewport,vpRight);

        // Sync ortho cameras to main camera (POI + scale)
        const sharedPoi  = camera.poi;
        const sharedSize = Math.max(0.1, camera.distance * 0.5);

        for (let i = 0; i < 4; i++)
        {
            const cam = this.views[i].camera;
            vec3.copy(cam.poi, sharedPoi);
            cam.size = sharedSize;
        }

        // --- Render main (no extra updates; already updated) ---
        this.RenderPass(dt, {
            scene,
            camera,
            viewport: vpMain,
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
                viewport: v.viewport,
                post,
                updateScene: false,
                updateCamera: true
            });
        }

        return true;
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
