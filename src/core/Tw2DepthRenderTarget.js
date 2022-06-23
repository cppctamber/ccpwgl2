import { Tw2TextureRes } from "core/resource";
import { tw2 } from "global";
import { meta, generateID } from "utils";


@meta.type("Tw2DepthRenderTarget")
export class Tw2DepthRenderTarget
{

    @meta.string
    name = "";

    @meta.float
    width = 0;

    @meta.float
    height = 0;

    @meta.uint
    precision = 16;


    _texture = null;
    _frameBuffer = null;
    _id = generateID();

    /**
     * Identifies that the render target has depth
     * @returns {boolean}
     */
    get hasDepth()
    {
        return true;
    }

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

    _colorAttachment = null;

    /**
     * Constructor
     * @param {String} [name=""]
     * @param {Number} [width]
     * @param {Number} [height]
     * @param {Number} [precision]
     */
    constructor(name = "", width, height, precision)
    {
        this.name = name;
        if (height) this.height = height;
        if (width) this.width = width;
        if (precision) this.precision = precision;
        if (this.height && this.width) this.Create(this.height, this.width, this.precision);
    }

    /**
     * Initializes the object
     */
    Initialize()
    {
        if (!this._frameBuffer && this.width && this.height)
        {
            this.Create(this.width, this.height, this.precision);
        }
    }

    /**
     * Checks if the render target is good
     * @return {boolean|null}
     */
    IsGood()
    {
        return !!(this._frameBuffer && this._texture && this._texture.IsGood());
    }

    /**
     * Keeps the render target alive
     */
    KeepAlive()
    {
        if (this._texture) this._texture.KeepAlive();
    }

    /**
     * Destroys the render target
     */
    Destroy()
    {
        const { gl } = tw2;

        if (this._texture)
        {
            gl.deleteTexture(this._texture.texture);
            this._texture.texture = null;
        }

        if (this._colorAttachment)
        {
            gl.deleteTexture(this._colorAttachment);
            this._colorAttachment = null;
        }

        if (this._frameBuffer)
        {
            gl.deleteFramebuffer(this._frameBuffer);
            this._frameBuffer = null;
        }
    }

    /**
     * Creates the render target
     * @param {Number} width
     * @param {Number} height
     * @param {Number} [precision=this.precision]
     */
    Create(width, height, precision = this.precision)
    {
        this.Destroy();

        const { gl, glVersion } = tw2.device;

        let internalFormat, type;
        if (glVersion === 1)
        {
            const ext = tw2.device.GetExtension("WEBGL_depth_texture");
            if (!ext) throw new ReferenceError("Depth textures not supported by device");
            internalFormat = gl.DEPTH_COMPONENT;
            type = gl.UNSIGNED_SHORT;
            if (precision !== undefined && precision !== 16)
            {
                tw2.Warning({
                    title: "Depth precision",
                    description: "Invalid depth for device, falling back to 16BIT"
                });
                precision = 16;
            }
        }
        else
        {
            switch (precision)
            {
                case 24:
                    internalFormat = gl.DEPTH_COMPONENT24;
                    type = gl.UNSIGNED_INT;
                    break;

                case 32:
                    internalFormat = gl.DEPTH_COMPONENT32F;
                    type = gl.FLOAT;
                    break;

                default:
                    if (precision !== 16)
                    {
                        tw2.Warning({
                            title: "Depth precision",
                            description: "Invalid depth for device, falling back to 16BIT"
                        });
                    }
                    precision = 16;
                    internalFormat = gl.DEPTH_COMPONENT16;
                    type = gl.UNSIGNED_SHORT;
            }
        }

        this.precision = precision;
        this._texture = this.texture || new Tw2TextureRes();
        this._texture.Attach(gl.createTexture());

        const
            res = this._texture,
            texture = res.texture;

        res._hasMipMaps = false;
        res._forceMipMaps = false;
        res._target = gl.TEXTURE_2D;
        res._internalFormat = internalFormat;
        res._width = this.width = width;
        res._height = this.height = height;
        res._type = type;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            internalFormat,
            width,
            height,
            0,
            gl.DEPTH_COMPONENT,
            type,
            null
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);

        this._internalFormat = internalFormat;

        this._colorAttachment = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._colorAttachment);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._colorAttachment, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Clears the render target texture
     * @param {boolean} [color=true]
     * @param {Boolean} [depth=true]
     * @param {Boolean} [stencil=true]
     * @param {vec4} [clearColor]
     */
    Clear(color, depth, stencil, clearColor)
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
     * Sets the render target
     */
    Set()
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl } = tw2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
    }

    /**
     * Unsets the render target
     */
    Unset()
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl, width, height } = tw2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
    }


}
