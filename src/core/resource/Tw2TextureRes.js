import { meta } from "utils";
import { device } from "global";

import {
    Tw2Resource,
    ErrResourceFormatUnsupported
} from "./Tw2Resource";

// Formats (they self-describe exts, and expose load/prepare)
import { TextureFormatTarga } from "./formats/TextureFormatTarga";
import { TextureFormatDDS } from "./formats/TextureFormatDDS";
import { TextureFormatImage } from "./formats/TextureFormatImage";
import { TextureFormatVideo } from "./formats/TextureFormatVideo";
import { TextureFormatHTML } from "./formats/TextureFormatHTML";


@meta.type("Tw2TextureRes")
export class Tw2TextureRes extends Tw2Resource
{
    texture = null;

    /**
     * Canvas attachment
     * @type {null|Tw2TextureResHTMLAttachment}
     */
    attachment = null;

    _runtime = null;

    _currentSampler = 0;
    _isAttached = false;
    _extension = "";

    _width = 0;
    _height = 0;

    _type = null;
    _format = null;
    _internalFormat = null;
    _target = null;

    _hasMipMaps = false;
    _mipCount = 1;

    _isCube = false;
    _isPowerOfTwo = false;
    _useNoMipFilter = false;

    // Volume atlas metadata (2D texture with slices stacked)
    _isVolumeAtlas = false;
    _volumeAxis = "y";   // "x" or "y"
    _volumeSlices = 1;

    _isSRGB = false;

    /**
     * Debug-only source metadata
     * @type {Object|null}
     */
    _debugInfo = null;

    // =========================
    // Helpers
    // =========================

    static IsPowerOfTwo(...args)
    {
        for (let i = 0; i < args.length; i++)
        {
            if ((args[i] & (args[i] - 1)) !== 0) return false;
        }
        return true;
    }

    DeleteGL()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture);
            this.texture = null;
        }
    }

    // =========================
    // Resource API
    // =========================

    Prepare(data)
    {
        const gl = device.gl;

        this.DeleteGL();

        // Reset per-prepare
        this._isVolumeAtlas = false;
        this._volumeAxis = "y";
        this._volumeSlices = 1;
        this._useNoMipFilter = false;
        this._debugInfo = null;

        const format = Tw2TextureRes.GetFormat(this._extension);
        if (!format) throw new ErrResourceFormatUnsupported({ format: this._extension });

        format.Prepare(this, gl, data);

        /*

        // Post-prepare invariants
        if (this._isVolumeAtlas)
        {
            this._useNoMipFilter = true;
            // Optional but consistent: ensure we don't claim mipmaps
            this._hasMipMaps = false;
            this._mipCount = 1;
        }

        // Disabled by true, and expected for run time
        // however it can be overwritten
        if (this._runtime && this._runtime.disableMipSampling)
        {
            this._useNoMipFilter = true;
            this._hasMipMaps = false;
            this._mipCount = 1;
        }

         */

        this._useNoMipFilter = true;

        this._isAttached = false;
        this.OnPrepared();
    }

    Bind(sampler, slicesUniform)
    {
        const d = device, { gl } = device;

        this.KeepAlive();

        if (this._target === null)
        {
            this._target = sampler.samplerType;
            this._isCube = sampler.samplerType === gl.TEXTURE_CUBE_MAP;
        }
        else if (sampler.samplerType !== this._target)
        {
            return;
        }

        if (!this.texture)
        {
            const tex = this._target === gl.TEXTURE_2D ? d.GetFallbackTexture() : d.GetFallbackCubeMap();
            gl.bindTexture(this._target, tex);
            return;
        }

        if (this._runtime && this._runtime.Update)
        {
            this._runtime.Update(this, gl);
        }

        if (sampler.isVolume && slicesUniform)
        {
            const slices = this._isVolumeAtlas
                ? this._volumeSlices
                : (() =>
                {
                    const ratio = this._height / this._width;
                    return Number.isFinite(ratio) ? Math.max(1, Math.round(ratio)) : 1;
                })();

            gl.uniform1f(slicesUniform, slices);
        }

        gl.bindTexture(this._target, this.texture);

        if (sampler.hash === null || sampler.hash !== this._currentSampler)
        {
            sampler.Apply(d, this._hasMipMaps, this._useNoMipFilter);
            this._currentSampler = sampler.hash;
        }
    }

    _ClearMeta()
    {
        this._extension = null;
        this._isAttached = false;

        this._width = 0;
        this._height = 0;

        this._type = null;
        this._format = null;
        this._internalFormat = null;
        this._target = null;

        this._mipCount = 1;
        this._hasMipMaps = false;

        this._isCube = false;
        this._isPowerOfTwo = false;
        this._useNoMipFilter = false;

        this._isSRGB = false;
        this._isVolumeAtlas = false;
        this._volumeAxis = "y";
        this._volumeSlices = 1;
        this._debugInfo = null;
    }

    _ClearRuntime()
    {
        if (this._runtime && this._runtime.Unload) this._runtime.Unload();
        this._runtime = null;
    }

    DoCustomLoad(path, extension)
    {
        // Global hints (routing, not decoding)
        this._isCube = path.toLowerCase().includes("_cube") || path.includes(".cube");

        // Try to guess srgb
        const p = path.toLowerCase();
        this._isSRGB = (p.includes("_a.") || p.includes("albedo") || p.includes("diffuse"));

        // Legacy remaps
        switch (extension)
        {
            case "cube":
                // old “.cube” -> png file on disk
                extension = this._extension = "png";
                this._isCube = true;
                path = path.substr(0, path.length - 5) + ".png";
                break;

            case "qube":
                // legacy "qube" container points to ".cube"
                extension = this._extension = "cube";
                this._isCube = true;
                path = path.replace(".qube", ".cube");
                break;

            default:
                break;
        }

        this._extension = extension;

        const format = Tw2TextureRes.GetFormat(extension);
        if (!format) throw new ErrResourceFormatUnsupported({ format: extension });

        return format.Load(this, path, extension);
    }

    Unload(log)
    {
        this.DeleteGL();
        this._ClearMeta();
        if (this._runtime && this._runtime.Unload) this._runtime.Unload();
        this._runtime = null;
        this.OnUnloaded(log);
        return true;
    }

    Attach(texture, path = "")
    {
        if (this.texture === texture) return;

        this.DeleteGL();
        this._ClearMeta();
        this._ClearRuntime();

        this.path = path;
        this.texture = texture;
        this._isAttached = true;

        this.OnLoaded({ hide: true, path: "attachment" });
        this.OnPrepared({ hide: true, path: "attachment" });
    }

    Reload(eventLog)
    {
        if (!this._isAttached)
        {
            return super.Reload(eventLog);
        }
    }

    /**
     * Utility: read back a 2D texture and return a dataURL PNG.
     * (Unrelated to volume conversion, but handy for debug/export.)
     */
    static CreateImageFrom2DTexture(texture, width = 512, height = 512, format = device.gl.RGBA, type = device.gl.UNSIGNED_BYTE)
    {
        const gl = device.gl;

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const data = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, format, type, data);

        gl.deleteFramebuffer(fb);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(data);
        ctx.putImageData(imageData, 0, 0);

        const img = new Image();
        img.src = canvas.toDataURL("image/png");
        return img;
    }

    // =========================
    // Static registry
    // =========================

    /** @type {Map<string, {exts:string[], Load:function, Prepare:function}>} */
    static _formats = new Map();

    /** @type {Array<{exts:string[], Load:function, Prepare:function}>} */
    static _formatHandlers = [];

    /**
     * Registers a texture format handler
     * @param {{formatName?:string, exts:string[], Load:(res:Tw2TextureRes, path:string, ext?:string)=>boolean, Prepare:(res:Tw2TextureRes, gl:WebGLRenderingContext, data:any)=>void, GetSupport?:(gl:WebGLRenderingContext)=>Object}} handler
     */
    static RegisterFormat(handler)
    {
        if (!handler || !Array.isArray(handler.exts) || !handler.Load || !handler.Prepare)
        {
            throw new TypeError("Invalid texture format handler");
        }

        if (!this._formatHandlers.includes(handler))
        {
            this._formatHandlers.push(handler);
        }

        for (let i = 0; i < handler.exts.length; i++)
        {
            this._formats.set(this.NormalizeExtension(handler.exts[i]), handler);
        }
    }

    /**
     * Gets a texture format handler by extension
     * @param {string} ext
     * @returns {*|null}
     */
    static GetFormat(ext)
    {
        return this._formats.get(this.NormalizeExtension(ext)) ?? null;
    }

    /**
     * Gets registered texture format handlers
     * @returns {Array<{name:String, exts:String[]}>}
     */
    static GetFormats()
    {
        const out = [];
        for (let i = 0; i < this._formatHandlers.length; i++)
        {
            const handler = this._formatHandlers[i];
            out.push({
                name: this.GetHandlerName(handler),
                exts: handler.exts.map(ext => this.NormalizeExtension(ext))
            });
        }
        return out;
    }

    /**
     * Gets finite texture format support metadata
     * @param {WebGLRenderingContext} [gl]
     * @param {Object} [opt]
     * @returns {Object}
     */
    static GetFormatSupport(gl = device.gl, opt)
    {
        const out = {};
        for (let i = 0; i < this._formatHandlers.length; i++)
        {
            const support = this.GetHandlerSupport(this._formatHandlers[i], gl, opt);
            out[support.name] = support;
        }
        return out;
    }

    /**
     * Gets normalized handler support metadata
     * @param {*} handler
     * @param {WebGLRenderingContext} gl
     * @param {Object} [opt]
     * @returns {Object}
     */
    static GetHandlerSupport(handler, gl, opt)
    {
        const name = this.GetHandlerName(handler);
        const raw = handler.GetSupport ? handler.GetSupport(gl, opt) : null;
        return this.NormalizeFormatSupport(handler, raw, name);
    }

    /**
     * Normalizes format support metadata
     * @param {*} handler
     * @param {*} support
     * @param {String} name
     * @returns {Object}
     */
    static NormalizeFormatSupport(handler, support, name)
    {
        support = support || { supported: true, declared: true, verified: true };

        return {
            name,
            exts: handler.exts.map(ext => this.NormalizeExtension(ext)),
            supported: !!support.supported,
            partial: !!support.partial,
            declared: support.declared !== undefined ? !!support.declared : !!support.supported,
            verified: support.verified !== undefined ? !!support.verified : !!support.supported,
            pending: !!support.pending,
            fallback: support.fallback ?? null,
            formats: support.formats || {},
            reason: support.reason || null
        };
    }

    /**
     * Gets a format handler's stable name
     * @param {*} handler
     * @returns {String}
     */
    static GetHandlerName(handler)
    {
        return handler.formatName || handler.name || this.NormalizeExtension(handler.exts[0]);
    }

    /**
     * Normalizes a texture extension
     * @param {String} ext
     * @returns {String}
     */
    static NormalizeExtension(ext)
    {
        return (ext || "").replace(/^\./, "").toLowerCase();
    }

}

Tw2Resource.prototype.DoCustomLoad = null;

Tw2TextureRes.RegisterFormat(TextureFormatDDS);
Tw2TextureRes.RegisterFormat(TextureFormatImage);
Tw2TextureRes.RegisterFormat(TextureFormatTarga);
Tw2TextureRes.RegisterFormat(TextureFormatVideo);
Tw2TextureRes.RegisterFormat(TextureFormatHTML);
