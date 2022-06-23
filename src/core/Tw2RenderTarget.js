import { meta, generateID } from "utils";
import { device, tw2 } from "global";
import { Tw2TextureRes } from "./resource/Tw2TextureRes";


@meta.type("Tw2RenderTarget")
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

    _id = generateID();
    _frameBuffer = null;
    _renderBuffer = null;
    _texture = null;

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
     */
    constructor(name="", width, height, depth=false)
    {
        this.name = name;
        if (width) this.width = width;
        if (height) this.height = height;
        this.hasDepth = depth;
        if (this.width && this.height) this.Create(this.width, this.height, this.hasDepth);
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
        return !!(this._frameBuffer && this._texture && this._texture.IsGood() && !this.hasDepth || this._renderBuffer);
    }

    /**
     * Destroys the render target's webgl buffers and textures
     */
    Destroy()
    {
        const { gl } = device;

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

        this.hasDepth = false;
        this.width = 0;
        this.height = 0;
    }

    /**
     * Creates the render target's texture
     * @param {Number} width     - The resulting texture's width
     * @param {Number} height    - The resulting texture's height
     * @param {Boolean} hasDepth - Optional flag to enable a depth buffer
     */
    Create(width, height, hasDepth)
    {
        const { gl } = device;

        this.Destroy();

        if (!this._texture) this._texture = new Tw2TextureRes();
        this._texture.Attach(gl.createTexture());

        const res = this._texture;
        
        // Keep track of meta
        res._target = gl.TEXTURE_2D;
        res._format = gl.RGBA;
        res._type = gl.UNSIGNED_BYTE;
        res._hasMipMaps = false;
        res._forceMipMaps = false;
        res._width = this.width = width;
        res._height = this.height = height;

        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, res.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this._renderBuffer = null;

        if (hasDepth)
        {
            this._renderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        }

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, res.texture, 0);

        if (hasDepth)
        {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._renderBuffer);
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.hasDepth = hasDepth;
    }

    /**
     * Clears the render target texture
     * @param {boolean} [color=true]
     * @param {Boolean} [depth=true]
     * @param {Boolean} [stencil=true]
     * @param {vec4} [clearColor]
     */
    Clear(color=true, depth=true, stencil=true, clearColor)
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl } = tw2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
        tw2.ClearBufferBits(color, depth, stencil);
        if (clearColor) tw2.SetClearColor(clearColor);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, tw2.width, tw2.height);
    }

    /**
     * Sets the render target as the current frame buffer
     */
    Set()
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl } = device;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
    }

    /**
     * Unsets the render target as the current frame buffer
     */
    Unset()
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl, viewportWidth, viewportHeight } = device;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, viewportWidth, viewportHeight);
    }

}
