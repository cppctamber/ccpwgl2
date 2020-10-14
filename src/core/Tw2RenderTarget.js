import { meta, util, device } from "global";
import { Tw2TextureRes } from "./resource/Tw2TextureRes";


@meta.ctor("Tw2RenderTarget")
export class Tw2RenderTarget
{

    @meta.string
    name = "";

    @meta.struct("Tw2TextureRes")
    @meta.isPrivate
    texture = null;

    @meta.float
    @meta.isPrivate
    width = 0;

    @meta.float
    @meta.isPrivate
    height = 0;

    @meta.boolean
    @meta.isPrivate
    hasDepth = false;


    _id = util.generateID();
    _frameBuffer = null;
    _renderBuffer = null;

    /**
     * Checks if the render target is good
     * @returns {null}
     */
    IsGood()
    {
        return this._frameBuffer && this._renderBuffer && this.texture;
    }

    /**
     * Destroys the render target's webgl buffers and textures
     */
    Destroy()
    {
        const { gl } = device;

        if (this.texture)
        {
            gl.deleteTexture(this.texture.texture);
            this.texture = null;
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

        this.hasDepth = false;
        this.width = 0;
        this.height = 0;
    }

    /**
     * Creates the render target's texture
     *
     * @param {Number} width     - The resulting texture's width
     * @param {Number} height    - The resulting texture's height
     * @param {Boolean} hasDepth - Optional flag to enable a depth buffer
     */
    Create(width, height, hasDepth)
    {
        const { gl } = device;

        this.Destroy();
        this.texture = new Tw2TextureRes();
        this.texture.Attach(gl.createTexture());

        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);

        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this._renderBuffer = null;

        if (hasDepth)
        {
            this._renderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        }

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);

        if (hasDepth)
        {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._renderBuffer);
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.texture.width = this.width = width;
        this.texture.height = this.height = height;
        this.hasDepth = hasDepth;
    }

    /**
     * Sets the render target as the current frame buffer
     */
    Set()
    {
        const { gl } = device;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
    }

    /**
     * Unsets the render target as the current frame buffer
     */
    Unset()
    {
        const { gl, viewportWidth, viewportHeight } = device;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, viewportWidth, viewportHeight);
    }

}
