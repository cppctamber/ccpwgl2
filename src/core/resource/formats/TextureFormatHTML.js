// formats/TextureFormatHTML.js
//
// TextureFormat-style replacement for Tw2TextureResHTMLAttachment.
// - Registered in Tw2TextureRes via the static format registry
// - Works as a "dynamic" texture source: canvas/img/video/any element
// - Uses a runtime object on the resource (res._runtime) to update per frame
//
// Notes:
// - Uses WebGL1-safe texImage2D(element) path when possible
// - On WebGL2, falls back to sized-alloc + texSubImage2D for stability
// - Keeps all DOM/dirty/update logic inside the runtime object, not Tw2TextureRes
//

import { device, resMan } from "global";
import { ErrResourceFormatUnsupported, ErrResourceFormatNotImplemented } from "../Tw2Resource";
import { TEX_2D, TEX_VOLUME, TEX_CUBE_MAP } from "constant/d3d";


/**
 * Runtime for HTML-backed textures (canvas/img/video/etc)
 * Lives on Tw2TextureRes as `res._runtime`.
 */
export class Tw2TextureResHTMLRuntime
{
    constructor()
    {
        this.type = "html";
        this.format = TextureFormatHTML; // default handler (can be swapped)

        /** @type {string|null} */
        this.id = null;

        /** @type {HTMLElement|null} */
        this.el = null;

        /** @type {boolean} Push pixels every frame when true */
        this.update = false;

        /** @type {number} TEX_2D | TEX_VOLUME | TEX_CUBE_MAP */
        this.target = TEX_2D;

        /** @type {boolean} Generate mipmaps when allowed */
        this.enableMipMaps = false;

        /** @type {boolean} Internal dirty flag (realloc/rebuild) */
        this.dirty = true;

        /** @type {number} */
        this.lastActiveFrame = -1;

        this.disableMipSampling = true;
    }

    /**
     * Sets the element by id or direct element reference
     * @param {string|HTMLElement|null} value
     */
    Set(value)
    {
        if (!value)
        {
            this.id = null;
            this.el = null;
            this.dirty = true;
            return;
        }

        if (typeof value === "string")
        {
            this.id = value;
            this.el = (typeof document !== "undefined") ? document.getElementById(value) : null;
            this.dirty = true;
            return;
        }

        this.id = null;
        this.el = value;
        this.dirty = true;
    }

    /**
     * Clears runtime-only state
     */
    Unload()
    {
        this.id = null;
        this.el = null;
        this.dirty = true;
        this.lastActiveFrame = -1;
        // leave type/format/update/target/enableMipMaps as-is (callers may reuse config)
    }

    /**
     * Per-frame update hook (called from Tw2TextureRes.Bind)
     * @param {import("../Tw2TextureRes").Tw2TextureRes} res
     * @param {WebGLRenderingContext} gl
     */
    Update(res, gl)
    {
        // default behavior delegates to the handler
        this.format.Update(res, gl, this);
    }
}


/**
 * TextureFormatHTML
 * - exts: ["html"] (a pseudo extension)
 * - Load: resolve element + mark loaded
 * - Prepare: allocate GL texture storage (optional; Update will upload pixels)
 * - Update: texImage2D/texSubImage2D from element as needed
 */
export class TextureFormatHTML
{
    static exts = [ "html" ];

    static CreateRuntime()
    {
        return new Tw2TextureResHTMLRuntime();
    }

    /**
     * Creates/assigns a runtime and resolves element if id-based.
     * This doesn't fetch anything: it just marks the resource loaded so Prepare can run.
     *
     * Usage patterns:
     * - res.path = "#myCanvas.html" (or any convention you like)
     * - OR manually set: res._runtime = TextureFormatHTML.CreateRuntime(); runtime.Set(elOrId);
     */
    static Load(res, path)
    {
        // Ensure runtime exists
        const rt = (res._runtime && res._runtime.type === "html")
            ? res._runtime
            : (res._runtime = TextureFormatHTML.CreateRuntime());

        // Optional: accept a "#id" path convention
        if (typeof path === "string" && path.startsWith("#"))
        {
            rt.Set(path.substring(1));
        }

        // Nothing async to fetch
        res.OnLoaded();
        resMan.Queue(res, undefined, "html"); // data not required
        return true;
    }

    /**
     * Ensures a GL texture exists and is configured for NPOT-friendly use.
     * @param {*} res Tw2TextureRes
     * @param {WebGLRenderingContext} gl
     * @param {*} _data unused
     */
    static Prepare(res, gl, _data)
    {
        const rt = res._runtime;
        if (!rt || rt.type !== "html")
        {
            throw new ErrResourceFormatUnsupported({ format: "html", reason: "Missing HTML runtime" });
        }

        // Resolve element if id-based and not already resolved
        if (!rt.el && rt.id && typeof document !== "undefined")
        {
            rt.el = document.getElementById(rt.id);
        }

        // Create texture if missing
        res.DeleteGL();

        res.texture = gl.createTexture();
        res._isAttached = true; // logically "attached" to a dynamic source

        // Target mapping
        switch (rt.target)
        {
            case TEX_2D:
            case TEX_VOLUME:
                res._target = gl.TEXTURE_2D;
                res._isCube = false;
                break;

            case TEX_CUBE_MAP:
                res._target = gl.TEXTURE_CUBE_MAP;
                res._isCube = true;
                throw new ErrResourceFormatNotImplemented({ format: "HTML->CubeMap" });

            default:
                throw new ReferenceError(`Invalid HTML texture target ${rt.target}`);
        }

        // Defaults (element upload is always RGBA8)
        res._internalFormat = gl.RGBA;
        res._format = gl.RGBA;
        res._type = gl.UNSIGNED_BYTE;

        res._hasMipMaps = false;
        res._mipCount = 1;

        // Width/height will be discovered on first successful Update upload
        res._width = 0;
        res._height = 0;
        res._isPowerOfTwo = false;

        // NPOT-safe params
        gl.bindTexture(res._target, res.texture);
        gl.texParameteri(res._target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(res._target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(res._target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(res._target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(res._target, null);

        rt.dirty = true; // force first upload allocation
    }

    /**
     * Upload pixels when needed.
     * Called via runtime.Update(res, gl) from Tw2TextureRes.Bind.
     */
    static Update(res, gl, rt)
    {
        // Once-per-frame guard (same pattern you used before)
        if (rt.lastActiveFrame === res.activeFrame) return;
        rt.lastActiveFrame = res.activeFrame;

        // Resolve element if needed
        if (!rt.el && rt.id && typeof document !== "undefined")
        {
            rt.el = document.getElementById(rt.id);
            rt.dirty = true;
        }

        const el = rt.el;
        if (!el || !res.texture) return;

        // Must have size (canvas/video/image)
        const w = el.width  ?? el.videoWidth  ?? el.naturalWidth  ?? 0;
        const h = el.height ?? el.videoHeight ?? el.naturalHeight ?? 0;
        if (!w || !h) return;

        // Skip if not updating and already uploaded once, unless dirty
        if (!rt.update && !rt.dirty && res._width === w && res._height === h) return;

        // Protect global pixelStore state (important)
        const prevFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
        const prevPremul = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
        const prevAlign = gl.getParameter(gl.UNPACK_ALIGNMENT);

        const hasCSC = ("UNPACK_COLORSPACE_CONVERSION_WEBGL" in gl);
        const prevCSC = hasCSC ? gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL) : null;

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        if (hasCSC) gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);

        gl.bindTexture(res._target, res.texture);

        try
        {
            const sizeChanged = (res._width !== w) || (res._height !== h);

            // WebGL1: texImage2D(target, level, internalFormat, format, type, element)
            // WebGL2: prefer allocate + texSubImage2D, but texImage2D(element) also works
            if (device.glVersion === 1)
            {
                gl.texImage2D(
                    res._target,
                    0,
                    res._internalFormat,
                    res._format,
                    res._type,
                    el
                );
            }
            else
            {
                // Allocate on first upload or when size changes
                if (rt.dirty || sizeChanged)
                {
                    gl.texImage2D(
                        res._target,
                        0,
                        res._internalFormat,
                        w,
                        h,
                        0,
                        res._format,
                        res._type,
                        null
                    );
                }

                gl.texSubImage2D(
                    res._target,
                    0,
                    0, 0,
                    res._format,
                    res._type,
                    el
                );
            }

            // Update metadata
            res._width = w;
            res._height = h;
            res._isPowerOfTwo = res.constructor.IsPowerOfTwo(w, h);

            // Mips if allowed
            if ((rt.enableMipMaps && device.glVersion !== 1) || res._isPowerOfTwo)
            {
                res._hasMipMaps = true;
                gl.generateMipmap(res._target);
                gl.texParameteri(res._target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            }
            else
            {
                res._hasMipMaps = false;
                gl.texParameteri(res._target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }

            gl.texParameteri(res._target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            rt.dirty = false;
        }
        finally
        {
            gl.bindTexture(res._target, null);

            // restore pixelStore
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, prevFlip);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, prevPremul);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevAlign);
            if (hasCSC) gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, prevCSC);
        }
    }
}


/*

// 1) Register like any other format
Tw2TextureRes.RegisterFormat(TextureFormatHTML);

// 2) Create a resource and attach a canvas (or id)
const res = new Tw2TextureRes();
res._runtime = TextureFormatHTML.CreateRuntime();
res._runtime.Set("myCanvasId");       // or res._runtime.Set(canvasEl)
res._runtime.update = true;           // push pixels every frame
res._runtime.enableMipMaps = false;   // optional

// 3) Kick the loader (or just call Prepare directly if you manage resMan)
res.DoCustomLoad("#myCanvasId", "html");

 */