import { meta } from "utils";
import { tw2 } from "global";
import { Tw2TextureRes } from "./resource/Tw2TextureRes";


@meta.type("Tw2RenderTarget")
@meta.wgl.define("Tw2RenderTarget")
export class Tw2RenderTarget
{

    @meta.string
    name = "";

    @meta.float
    width = 0;

    @meta.float
    height = 0;

    @meta.boolean
    hasDepth = false;

    /**
     * Colour format name, null being the historical 8-bit RGBA target
     * @type {String|null}
     */
    @meta.string
    colorFormat = null;

    _frameBuffer = null;
    _renderBuffer = null;
    _texture = null;
    _prevViewport = null;
    _prevFramebuffer = null;

    /**
     * Gets the render target's texture res
     * Todo: Refactor all uses to "textureRes"
     * @returns {null|Tw2TextureRes}
     */
    get texture()
    {
        return this._texture;
    }

    /**
     * Gets the render target's gl texture
     * @returns {null|WebGLTexture}
     */
    get glTexture()
    {
        return this._texture ? this._texture.texture : null;
    }

    /**
     * Constructor
     * @param {String} [name=""]
     * @param {Number} [width]
     * @param {Number} [height]
     * @param {Boolean} [depth=false]
     * @param {String} [colorFormat=null] - "rgba8" (default), "rgba16f" or "rgba32f"
     */
    constructor(name="", width, height, depth=false, colorFormat=null)
    {
        this.name = name;
        if (width) this.width = width;
        if (height) this.height = height;
        this.hasDepth = depth;
        this.colorFormat = colorFormat;
        if (this.width && this.height) this.Create(this.width, this.height, this.hasDepth, this.colorFormat);
    }

    /**
     * Initializes the object
     */
    Initialize()
    {
        if (this.width && this.height && !this.IsGood())
        {
            this.Create(this.width, this.height, this.hasDepth);
        }
    }

    /**
     * Checks if the render target is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(
            this._frameBuffer &&
            this._texture &&
            this._texture.IsGood() &&
            (!this.hasDepth || this._renderBuffer)
        );
    }

    /**
     * Destroys the render target's webgl buffers and textures
     */
    Destroy()
    {
        const { gl } = tw2;

        if (this._texture)
        {
            gl.deleteTexture(this._texture.texture);
            this._texture.texture = null;
        }

        if (this._renderBuffer)
        {
            gl.deleteRenderbuffer(this._renderBuffer);
            this._renderBuffer = null;
        }

        if (this._frameBuffer)
        {
            gl.deleteFramebuffer(this._frameBuffer);
            this._frameBuffer = null;
        }
    }

    /**
     * Updates the render target
     * @param {Number} targetWidth
     * @param {Number} targetHeight
     * @param {Boolean} [hasDepth=this.hasDepth]
     * @param {String} [colorFormat=this.colorFormat]
     * @returns {boolean} true if updated
     */
    Update(targetWidth, targetHeight, hasDepth=this.hasDepth, colorFormat=this.colorFormat)
    {
        if (
            this.width !== targetWidth ||
            this.height !== targetHeight ||
            hasDepth !== this.hasDepth ||
            colorFormat !== this.colorFormat
        )
        {
            this.Create(targetWidth, targetHeight, hasDepth, colorFormat);
            return true;
        }
        return false;
    }

    /**
     * Creates the render target's texture
     * @param {Number} width     - The resulting texture's width
     * @param {Number} height    - The resulting texture's height
     * @param {Boolean} hasDepth - Optional flag to enable a depth buffer
     */
    Create(width, height, hasDepth, colorFormat=this.colorFormat)
    {
        const { gl } = tw2;

        this.Destroy();

        const { internalFormat, format, type } = Tw2RenderTarget.ResolveColorFormat(colorFormat);

        if (!this._texture) this._texture = new Tw2TextureRes();
        this._texture.suppressLogging = true;
        this._texture.Attach(gl.createTexture());

        const res = this._texture;
        res._target = gl.TEXTURE_2D;
        res._internalFormat = internalFormat;
        res._format = format;
        res._type = type;
        res._hasMipMaps = false;
        res._forceMipMaps = false;
        res._width = this.width = width;
        res._height = this.height = height;

        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, res.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this._renderBuffer = null;

        if (hasDepth)
        {
            this._renderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderBuffer);

            // 24 bits where it is available. The canvas's own depth buffer is
            // typically 24, so a 16-bit target is a downgrade rather than parity,
            // and a scene spanning kilometres to millions of kilometres z-fights
            // visibly at 16. DEPTH_COMPONENT24 is core in WebGL2.
            const depthFormat = tw2.device.glVersion > 1 ? gl.DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT16;
            gl.renderbufferStorage(gl.RENDERBUFFER, depthFormat, width, height);
        }

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, res.texture, 0);

        if (hasDepth)
        {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._renderBuffer);
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.hasDepth = hasDepth;
        this.colorFormat = colorFormat;
    }

    /**
     * Resolves a colour format name to its gl enums
     *
     * `null` is the historical 8-bit target and must stay the default: every
     * existing caller relies on it, and two of them (`Tw2Picker` and
     * `EveLensflare`) read back with `RGBA`/`UNSIGNED_BYTE` and would break
     * outright on a float target.
     *
     * A float target is NOT guaranteed even on WebGL2 — rendering into one needs
     * `EXT_color_buffer_float`, which `Tw2Device` probes. This throws rather than
     * silently falling back, because a silent 8-bit fallback under an HDR
     * pipeline looks like a tone-mapping bug rather than a missing extension.
     *
     * @param {String|null} [colorFormat]
     * @returns {{ internalFormat: Number, format: Number, type: Number }}
     */
    static ResolveColorFormat(colorFormat)
    {
        const { gl, device } = tw2;

        switch (colorFormat)
        {
            case undefined:
            case null:
            case "rgba8":
                return { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE };

            case "rgba16f":
                if (!device.canRenderToHalfFloat)
                {
                    throw new ReferenceError("Cannot create an rgba16f render target: EXT_color_buffer_float is unavailable");
                }
                return { internalFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT };

            case "rgba32f":
                if (!device.canRenderToFloat)
                {
                    throw new ReferenceError("Cannot create an rgba32f render target: EXT_color_buffer_float is unavailable");
                }
                return { internalFormat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT };

            default:
                throw new TypeError(`Unknown render target colour format: ${colorFormat}`);
        }
    }

    /**
     * Clears the render target texture
     * @param {boolean} [color=true]
     * @param {Boolean} [depth=true]
     * @param {Boolean} [stencil=true]
     * @param {vec4} [clearColor=]
     */
    Clear(color=true, depth=true, stencil=true, clearColor)
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl } = tw2;

        // Restore what was bound rather than assuming the canvas, as Set/Unset
        // already do. Binding null here is only correct while the frame's output
        // IS the canvas; it silently detaches an enclosing render target
        // otherwise, and the damage shows up in whatever draws next.
        const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        const prevViewport = gl.getParameter(gl.VIEWPORT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
        if (clearColor) tw2.SetClearColor(clearColor);
        tw2.ClearBufferBits(color, depth, stencil);

        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer);
        gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
    }

    /**
     * Sets the render target as the current frame buffer
     * @param {Object} [clearOptions]
     */
    Set(clearOptions)
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl } = tw2;

        this._prevViewport = gl.getParameter(gl.VIEWPORT);
        this._prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);

        if (clearOptions)
        {
            if (clearOptions.clearColor) tw2.SetClearColor(clearOptions.clearColor);
            tw2.ClearBufferBits(clearOptions.clearColorBit, clearOptions.clearDepthBit, clearOptions.clearStencilBit);
        }
    }

    /**
     * Unsets the render target as the current frame buffer
     */
    Unset()
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl } = tw2;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._prevFramebuffer);
        if (this._prevViewport)
        {
            gl.viewport(this._prevViewport[0], this._prevViewport[1], this._prevViewport[2], this._prevViewport[3]);
        }

        this._prevFramebuffer = null;
        this._prevViewport = null;
    }

    /**
     * Sets the render target, calls a method if good, then unsets the render target
     * @param {Function} func
     * @param {Boolean}
     */
    SetCallUnset(func)
    {
        if (!this.IsGood()) return false;

        const { gl } = tw2;
        const
            fallbackViewport = new Float32Array([ 0, 0, tw2.width, tw2.height ]),
            prevViewport = gl.getParameter(gl.VIEWPORT) || fallbackViewport,
            prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
        func(this);
        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer);
        gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
        return true;
    }

    /**
     * Reads pixels
     * @param {Uint8Array} uint8array
     * @param {Number} x
     * @param {Number} y
     * @param {Number} [width=1]
     * @param {Number} [height=1]
     * @returns {null|}
     */
    ReadPixels(uint8array, x, y, width=1, height=1)
    {
        // Clear receiving array
        const len = width * height * 4;
        for (let i = 0; i < len; i++) uint8array[i] = 0;
        if (!this.IsGood()) return null;

        // The read below is fixed at RGBA/UNSIGNED_BYTE, which is right for the
        // callers that exist (picker ids, lensflare occlusion) and wrong for a
        // float target. Fail loudly: readPixels would otherwise return zeroes,
        // and a picker that silently always picks nothing is a miserable bug.
        if (this.colorFormat)
        {
            throw new TypeError(`ReadPixels does not support the "${this.colorFormat}" colour format`);
        }

        const { gl } = tw2;
        const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);

        gl.readPixels(
            Math.floor(x),
            Math.floor(y),
            width,
            height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            uint8array
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer);
        return uint8array;
    }

}
