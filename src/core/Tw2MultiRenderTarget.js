import { meta } from "utils";
import { tw2 } from "global";
import { Tw2TextureRes } from "./resource/Tw2TextureRes";
import { Tw2RenderTarget } from "./Tw2RenderTarget";


/**
 * A render target with more than one colour attachment.
 *
 * `Tw2RenderTarget` attaches exactly one texture, which is right for almost
 * everything the engine draws: a pass produces a picture. Some passes produce
 * SEVERAL quantities from one set of inputs, and splitting them into separate
 * passes means reading those inputs again for every output.
 *
 * The GPU particle simulation is the case in hand. It reads a particle's
 * position and velocity and produces both a new position and a new velocity —
 * so with one attachment it costs two passes over the same texels, and with two
 * it costs one.
 *
 * A SEPARATE class rather than an option on `Tw2RenderTarget`, deliberately.
 * That target is used by nearly every pass in the engine and its single
 * attachment is load bearing for all of them; a second attachment reached
 * through the same object is a way for an unrelated pass to end up with a draw
 * buffer state it never asked for.
 *
 * ## WebGL2 only
 *
 * `drawBuffers` is core in WebGL2 and an extension in WebGL1, and this does not
 * take the extension path: a consumer that needs several outputs also needs
 * GLSL ES 3.00 to declare them, which is WebGL2 anyway. On WebGL1 this refuses
 * to create rather than half-working.
 */
@meta.define("Tw2MultiRenderTarget")
export class Tw2MultiRenderTarget
{

    @meta.string
    name = "";

    @meta.uint
    width = 0;

    @meta.uint
    height = 0;

    /**
     * How many colour attachments, and so how many outputs a shader writing to
     * this must declare.
     * @type {Number}
     */
    @meta.uint
    count = 0;

    @meta.string
    colorFormat = null;

    _textures = [];
    _frameBuffer = null;
    _renderBuffer = null;
    _isComplete = false;
    _prevViewport = null;
    _prevFramebuffer = null;


    /**
     * @param {String} [name]
     * @param {Number} [width]
     * @param {Number} [height]
     * @param {Number} [count=2]
     * @param {String} [colorFormat]
     */
    constructor(name = "", width, height, count = 2, colorFormat = null)
    {
        this.name = name;
        this.colorFormat = colorFormat;
        if (width && height) this.Create(width, height, count, colorFormat);
    }

    /**
     * Creates the attachments.
     *
     * @param {Number} width
     * @param {Number} height
     * @param {Number} [count=2]
     * @param {String} [colorFormat=this.colorFormat]
     * @returns {Boolean} true if the target is usable
     */
    Create(width, height, count = 2, colorFormat = this.colorFormat)
    {
        const { gl, device } = tw2;

        this.Destroy();

        if (device.glVersion < 2)
        {
            tw2.Warning({
                name: "Multi render target",
                description: "Requires WebGL2 - a consumer needing several outputs needs GLSL ES 3.00 to declare them"
            });
            return false;
        }

        const max = Math.min(
            gl.getParameter(gl.MAX_DRAW_BUFFERS),
            gl.getParameter(gl.MAX_COLOR_ATTACHMENTS)
        );

        if (count < 1 || count > max)
        {
            tw2.Warning({
                name: "Multi render target",
                description: `${count} attachments requested but this device allows ${max}`
            });
            return false;
        }

        // The same resolver the single target uses, so a format means the same
        // thing in both and cannot drift.
        const { internalFormat, format, type } = Tw2RenderTarget.ResolveColorFormat(colorFormat);

        this.width = width;
        this.height = height;
        this.count = count;
        this.colorFormat = colorFormat;

        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);

        const buffers = [];

        for (let i = 0; i < count; i++)
        {
            const res = new Tw2TextureRes();
            res.suppressLogging = true;
            res.Attach(gl.createTexture());

            res._target = gl.TEXTURE_2D;
            res._internalFormat = internalFormat;
            res._format = format;
            res._type = type;
            res._hasMipMaps = false;
            res._forceMipMaps = false;
            res._width = width;
            res._height = height;

            gl.bindTexture(gl.TEXTURE_2D, res.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, res.texture, 0);

            this._textures.push(res);
            buffers.push(gl.COLOR_ATTACHMENT0 + i);
        }

        // Without this only attachment zero is written, whatever the shader
        // declares - and the other outputs are dropped in silence rather than
        // raising anything.
        gl.drawBuffers(buffers);

        this._isComplete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if (!this._isComplete)
        {
            // Fail soft, like the single target: incompleteness can be
            // transient, and an owner should be able to disable itself through
            // IsGood rather than take the frame down.
            this.Destroy();
            return false;
        }

        return true;
    }

    /**
     * @returns {Boolean}
     */
    IsGood()
    {
        if (!this._isComplete || !this._frameBuffer || this._textures.length !== this.count) return false;
        for (let i = 0; i < this._textures.length; i++)
        {
            if (!this._textures[i] || !this._textures[i].IsGood()) return false;
        }
        return true;
    }

    /**
     * The texture resource behind one attachment.
     * @param {Number} index
     * @returns {?Tw2TextureRes}
     */
    GetTexture(index)
    {
        return this._textures[index] || null;
    }

    /**
     * Binds the target and sizes the viewport to it.
     *
     * `drawBuffers` is FRAMEBUFFER state, so it is restored by binding, and
     * does not have to be set again here.
     *
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
     * Restores what was bound before {@link Set}.
     */
    Unset()
    {
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
     * Sets, calls, and unsets even if the call throws.
     * @param {Function} func
     * @returns {Boolean} true if it ran
     */
    SetCallUnset(func)
    {
        if (!this.IsGood()) return false;

        this.Set();

        try
        {
            func(this);
        }
        finally
        {
            this.Unset();
        }

        return true;
    }

    /**
     * @returns {Tw2MultiRenderTarget}
     */
    Destroy()
    {
        const { gl } = tw2;

        for (let i = 0; i < this._textures.length; i++)
        {
            if (this._textures[i]) this._textures[i].Unload();
        }

        this._textures = [];

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

        this._isComplete = false;
        this.count = 0;
        return this;
    }

}
