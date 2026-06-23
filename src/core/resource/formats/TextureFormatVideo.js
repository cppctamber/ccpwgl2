// formats/TextureFormatVideo.js
import { device, resMan } from "global";
import { ErrHTTPRequest } from "../../engine/Tw2ResMan";
import { ErrResourceFormatUnsupported } from "../Tw2Resource";

/**
 * Per-resource runtime for video-backed textures.
 * Owns all video-related parameters + Play/Pause API + safe cleanup.
 *
 * The default Update delegates to TextureFormatVideo.Update(res, gl, runtime).
 * If you want custom behavior per-instance, you can override runtime.Update.
 */
export class VideoRuntime
{
    constructor()
    {
        this.type = "video";
        this.format = TextureFormatVideo; // default handler (can be swapped)

        /** @type {HTMLVideoElement|null} */
        this.el = null;

        this.playable = false;
        this.isPlaying = false;

        this.cycle = true;
        this.playOnLoad = true;

        this.allowUpscale = false;

        /**
         * Optional explicit resize target (0 = ignore)
         * If quality > 0 these are ignored.
         */
        this.resizeWidth = 0;
        this.resizeHeight = 0;

        /**
         * Optional uniform scale factor (0 = disabled)
         * Examples: 0.5 = half res, 0.25 = quarter res, 1.0 = native
         */
        this.quality = 0;

        /** Fit-to-longest resolution cap (0 disables) */
        this.maxResolution = 0;

        /** Optional resize/crop canvas */
        /** @type {HTMLCanvasElement|null} */
        this.canvas = null;
        /** @type {CanvasRenderingContext2D|null} */
        this.ctx = null;

        // frame-accurate update tracking
        this.lastUploadedTime = -1;
        this.hasNewFrame = false;
        this.useVFC = false; // requestVideoFrameCallback supported

        /** @type {null|function(*):void} */
        this.onPlaying = null;
        /** @type {null|function(*):void} */
        this.onPause = null;
        /** @type {null|function(*):void} */
        this.onEnded = null;


        this.disableMipSampling = true;
    }

    /**
     * Default update path: delegate to the format handler.
     * You can override this per-instance if you want.
     * @param {import("../Tw2TextureRes").Tw2TextureRes} res
     * @param {WebGLRenderingContext} gl
     */
    Update(res, gl)
    {
        this.format?.Update?.(res, gl, this);
    }

    /**
     * Plays the video (or arms playOnLoad if not yet playable)
     * @param {boolean} cycle
     * @param {null|function(*):void} onFinished
     */
    Play(cycle = false, onFinished = null)
    {
        this.cycle = !!cycle;
        this.onEnded = onFinished;

        if (this.el && this.playable)
        {
            this.el.loop = this.cycle;
            this.el.play();
        }
        else
        {
            this.playOnLoad = true;
        }
    }

    /**
     * Pauses the video (or disarms playOnLoad if not ready)
     */
    Pause()
    {
        if (this.el)
        {
            this.el.pause();
        }
        else
        {
            this.playOnLoad = false;
        }
    }

    /**
     * Clears all video-related state safely.
     * NOTE: Tw2TextureRes.Unload should call res._runtime.Unload() and then null res._runtime.
     */
    Unload()
    {
        if (this.el)
        {
            try
            {
                this.el.pause();
                this.el.src = "";
                this.el.load();
            }
            catch (_) { /* ignore */ }
        }

        this.el = null;

        this.playable = false;
        this.isPlaying = false;

        this.canvas = null;
        this.ctx = null;

        this.lastUploadedTime = -1;
        this.hasNewFrame = false;
        this.useVFC = false;

        this.onPlaying = null;
        this.onPause = null;
        this.onEnded = null;

        // leave format/type alone unless you want to fully null it:
        // this.format = null;
    }
}

/**
 * TextureFormat handler for video textures.
 * Standard: static exts / Load / Prepare / Update.
 */
export class TextureFormatVideo
{
    static formatName = "video";

    static exts = [
        "mp4",
        "webm",
        "ogg"
    ];

    static GetSupport()
    {
        const hasVideo = typeof document !== "undefined" && !!document.createElement("video").canPlayType;

        return {
            supported: hasVideo,
            partial: false,
            declared: hasVideo,
            verified: hasVideo,
            fallback: null,
            formats: {
                mp4: { declared: hasVideo, verified: hasVideo },
                webm: { declared: hasVideo, verified: hasVideo },
                ogg: { declared: hasVideo, verified: hasVideo }
            },
            reason: hasVideo ? null : "video_element_unavailable"
        };
    }

    /**
     * Creates/returns a VideoRuntime and attaches it to res._runtime.
     * @param {import("../Tw2TextureRes").Tw2TextureRes} res
     * @returns {VideoRuntime}
     */
    static EnsureRuntime(res)
    {
        const rt = res._runtime;
        if (rt && rt.type === "video") return rt;

        const v = new VideoRuntime();
        res._runtime = v;
        return v;
    }

    /**
     * Loads a video element and queues it to the resource manager.
     * @param {import("../Tw2TextureRes").Tw2TextureRes} res
     * @param {string} path
     * @returns {boolean}
     */
    static Load(res, path)
    {
        resMan.AddPendingLoad(path);

        const v = document.createElement("video");
        v.crossOrigin = "anonymous";
        v.muted = true;
        v.playsInline = true;

        const rt = TextureFormatVideo.EnsureRuntime(res);

        rt.el = v;
        rt.playable = false;
        rt.isPlaying = false;
        rt.lastUploadedTime = -1;
        rt.hasNewFrame = false;

        // frame callback support
        rt.useVFC = typeof v.requestVideoFrameCallback === "function";
        if (rt.useVFC)
        {
            const onFrame = () =>
            {
                // ignore stale callbacks after unload/reload
                const cur = res._runtime;
                if (!cur || cur.type !== "video" || cur.el !== v) return;

                cur.hasNewFrame = true;
                v.requestVideoFrameCallback(onFrame);
            };

            v.requestVideoFrameCallback(onFrame);
        }

        v.onerror = () =>
        {
            resMan.RemovePendingLoad(path);

            const cur = res._runtime;
            if (cur && cur.type === "video" && cur.el === v)
            {
                cur.el = null;
            }

            res.OnError(new ErrHTTPRequest({ path }));
        };

        // loadedmetadata ensures videoWidth/videoHeight are available
        v.onloadedmetadata = () =>
        {
            rt.playable = true;
            resMan.RemovePendingLoad(path);

            // Queue the element as the "prepared input" like your other formats
            resMan.Queue(res, v);

            res.OnLoaded();
        };

        v.onended = () =>
        {
            rt.isPlaying = false;
            if (rt.onEnded) rt.onEnded(res);
        };

        v.onpause = () =>
        {
            rt.isPlaying = false;
            if (rt.onPause) rt.onPause(res);
        };

        v.onplaying = () =>
        {
            rt.isPlaying = true;
            if (rt.onPlaying) rt.onPlaying(res);
        };

        v.src = path;
        return true;
    }

    /**
     * Prepare allocates the GL texture and optional resize canvas.
     * @param {import("../Tw2TextureRes").Tw2TextureRes} res
     * @param {WebGLRenderingContext} gl
     * @param {HTMLVideoElement} videoEl
     */
    static Prepare(res, gl, videoEl)
    {
        const rt = res._runtime;

        if (!rt || rt.type !== "video" || !videoEl || rt.el !== videoEl)
        {
            throw new ErrResourceFormatUnsupported({
                format: "video",
                reason: "Missing or mismatched video element"
            });
        }

        const { srcW, srcH, outW, outH } = TextureFormatVideo.GetOutputSize(rt, videoEl);

        // Setup optional resize/crop canvas when output differs from source
        if (srcW && srcH && (outW !== srcW || outH !== srcH))
        {
            rt.canvas = document.createElement("canvas");
            rt.canvas.width = outW;
            rt.canvas.height = outH;

            rt.ctx = rt.canvas.getContext("2d", {
                alpha: false,
                desynchronized: true
            });

            if (rt.ctx)
            {
                rt.ctx.imageSmoothingEnabled = true;
                rt.ctx.imageSmoothingQuality = "high";
            }
        }
        else
        {
            rt.canvas = null;
            rt.ctx = null;
        }

        // Mutate Tw2TextureRes "texture fields" only (same shape as other formats)
        res.DeleteGL();

        res.texture = gl.createTexture();
        res._target = gl.TEXTURE_2D;
        res._isCube = false;

        res._width = outW;
        res._height = outH;

        // NPOT-safe defaults for video
        res._isPowerOfTwo = false;
        res._hasMipMaps = false;
        res._mipCount = 1;

        res._format = gl.RGBA;
        res._type = gl.UNSIGNED_BYTE;

        // Keep your current behavior: videos treated as sRGB on WebGL2
        const isWebGL2 = device.glVersion > 1;
        res._internalFormat = isWebGL2 ? gl.SRGB8_ALPHA8 : gl.RGBA;

        gl.bindTexture(gl.TEXTURE_2D, res.texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Allocate storage once at output size
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            res._internalFormat,
            outW,
            outH,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );

        gl.bindTexture(gl.TEXTURE_2D, null);

        // Play if requested
        videoEl.loop = !!rt.cycle;
        if (rt.playOnLoad) videoEl.play();
    }

    /**
     * Called from Tw2TextureRes.Bind via res._runtime.Update(res, gl).
     * Uploads a new frame if there is one.
     * @param {import("../Tw2TextureRes").Tw2TextureRes} res
     * @param {WebGLRenderingContext} gl
     * @param {VideoRuntime} rt
     */
    static Update(res, gl, rt)
    {
        if (!rt || !rt.el || !res.texture) return;

        const v = rt.el;

        const canUpload =
            v.readyState >= v.HAVE_CURRENT_DATA &&
            (v.videoWidth || 0) > 0 &&
            (v.videoHeight || 0) > 0;

        if (!canUpload) return;

        let shouldUpload = false;
        if (rt.useVFC)
        {
            shouldUpload = rt.hasNewFrame;
        }
        else
        {
            const t = v.currentTime || 0;
            shouldUpload = t !== rt.lastUploadedTime;
        }

        if (!shouldUpload) return;

        rt.hasNewFrame = false;

        gl.bindTexture(gl.TEXTURE_2D, res.texture);

        // IMPORTANT: protect global pixelStore state
        const prevFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
        const prevPremul = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
        const prevAlign = gl.getParameter(gl.UNPACK_ALIGNMENT);

        const hasCSC = ("UNPACK_COLORSPACE_CONVERSION_WEBGL" in gl);
        const prevCSC = hasCSC ? gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL) : null;

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        if (hasCSC)
        {
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
        }

        try
        {
            if (rt.canvas && rt.ctx)
            {
                TextureFormatVideo.DrawToCanvas(rt);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, rt.canvas);
            }
            else
            {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, v);
            }
        }
        finally
        {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, prevFlip);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, prevPremul);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevAlign);
            if (hasCSC) gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, prevCSC);
        }

        rt.lastUploadedTime = v.currentTime || 0;
    }

    static DrawToCanvas(rt)
    {
        const v = rt.el;
        const ctx = rt.ctx;
        const cw = rt.canvas.width;
        const ch = rt.canvas.height;

        const sw = v.videoWidth;
        const sh = v.videoHeight;
        if (!sw || !sh) return;

        // crop-to-fill (ideal for decals)
        const s = Math.max(cw / sw, ch / sh);
        const dw = sw * s;
        const dh = sh * s;
        const dx = (cw - dw) * 0.5;
        const dy = (ch - dh) * 0.5;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(v, dx, dy, dw, dh);
    }

    static GetOutputSize(rt, v)
    {
        const srcW = v.videoWidth || 0;
        const srcH = v.videoHeight || 0;

        if (!srcW || !srcH) return { srcW, srcH, outW: 1, outH: 1 };

        // 1) Uniform scale via quality (highest priority)
        if (rt.quality && rt.quality > 0)
        {
            const q = Math.max(0.01, rt.quality);
            const scale = rt.allowUpscale ? q : Math.min(1.0, q);

            return {
                srcW, srcH,
                outW: Math.max(1, Math.round(srcW * scale)),
                outH: Math.max(1, Math.round(srcH * scale))
            };
        }

        // 2) Fit to maxResolution (preserve aspect ratio)
        if (rt.maxResolution && rt.maxResolution > 0)
        {
            const longest = Math.max(srcW, srcH);
            const target = Math.max(1, rt.maxResolution);

            let scale = target / longest;
            if (!rt.allowUpscale) scale = Math.min(1.0, scale);

            return {
                srcW, srcH,
                outW: Math.max(1, Math.round(srcW * scale)),
                outH: Math.max(1, Math.round(srcH * scale))
            };
        }

        // 3) Explicit resize if provided
        const outW = rt.resizeWidth > 0 ? rt.resizeWidth : srcW;
        const outH = rt.resizeHeight > 0 ? rt.resizeHeight : srcH;

        return {
            srcW, srcH,
            outW: Math.max(1, outW),
            outH: Math.max(1, outH)
        };
    }
}
