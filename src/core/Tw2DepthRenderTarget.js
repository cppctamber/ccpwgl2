import { Tw2TextureRes } from "core/resource";
import { tw2 } from "global";
import { meta } from "utils";
import { Tw2TextureParameter } from "./parameter";


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

    _attached = false;
    _internalFormat = null;
    _depthTexture = null;
    _colorTexture = null;
    _frameBuffer = null;

    /**
     * Identifies if the depth texture is an attachment
     * @returns {boolean}
     */
    get isAttached()
    {
        return this._attached;
    }

    /**
     * Identifies that the render target has depth
     * @returns {boolean}
     */
    get hasDepth()
    {
        return true;
    }

    /**
     * Gets the render target's depth texture res
     * @returns {null|Tw2TextureRes}
     */
    get depthTexture()
    {
        return this._depthTexture;
    }

    /**
     * Gets the render target's depth gl texture
     * @returns {null|WebGLTexture}
     */
    get depthTextureGL()
    {
        return this._depthTexture ? this._depthTexture.texture : null;
    }

    /**
     * Gets the render target's colour texture
     * @returns {null|Tw2TextureRes}
     */
    get texture()
    {
        return this._colorTexture;
    }

    /**
     * Gets the render target's colour gl texture
     * @returns {null|WebGLTexture}
     */
    get textureGL()
    {
        return this._colorTexture ? this._colorTexture.texture : null;
    }

    /**
     * Constructor
     * @param {String} [name=""]
     * @param {Number} [width]
     * @param {Number} [height]
     * @param {Number} [precision]
     * @param {null|Tw2TextureParameter|Tw2TextureRes} [depthTexture]
     */
    constructor(name = "", width=0, height=0, precision=16, depthTexture)
    {
        this.name = name;
        this.height = height;
        this.width = width;
        this.precision = precision;
        this.AttachDepthTexture(depthTexture, width == 0 && height ==0);
    }

    /**
     * Attaches a depth texture
     * @param {null|Tw2TextureRes|Tw2TextureParameter} attachment
     * @param {Boolean} [skipCreate]
     * @returns {Boolean} true if attached
     */
    AttachDepthTexture(attachment, skipCreate)
    {
        if (!attachment)
        {
            let didUpdate = false;
            this._attached = false;
            if (this._depthTexture)
            {
                this._depthTexture = null;
                didUpdate = true;
            }
            if (!skipCreate) this.Create(this.width, this.height, this.precision);
            return didUpdate;
        }

        this._attached = true;

        if (attachment instanceof Tw2TextureParameter)
        {
            if (attachment.textureRes && attachment.textureRes === this._depthTexture)
            {
                return false;
            }

            attachment.AttachTextureRes(new Tw2TextureRes());
            this._depthTexture = attachment.textureRes;
            if (!skipCreate) this.Create(this.width, this.height, this.precision);
            return true;
        }

        if (this._depthTexture !== attachment)
        {
            this._depthTexture = attachment;
            if (!skipCreate) this.Create(this.width, this.height, this.precision);
            return true;
        }

        return false;
    }

    /**
     * Updates the render target
     * @param {Number} targetWidth
     * @param {Number} targetHeight
     * @param {Number} precision
     * @returns {boolean} true if updated
     */
    Update(targetWidth, targetHeight, precision=this.precision)
    {
        if (this.width !== targetWidth || this.height !== targetHeight || this.precision !== precision)
        {
            this.Create(targetWidth, targetHeight);
            return true;
        }
        return false;
    }

    /**
     * Initializes the object
     */
    Initialize()
    {
        if (this.width && this.height)
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
        return !!(
            this._frameBuffer &&
            this._depthTexture &&
            this._depthTexture.IsGood()
        );
    }

    /**
     * Keeps the render target alive
     */
    KeepAlive()
    {
        if (this._depthTexture) this._depthTexture.KeepAlive();
        if (this._colorTexture) this._colorTexture.KeepAlive();
    }

    /**
     * Destroys the render target
     */
    Destroy()
    {
        const { gl } = tw2;

        if (this._depthTexture)
        {
            this._depthTexture.DeleteGL();
        }
        
        if (this._colorTexture)
        {
            this._colorTexture.DeleteGL();
        }

        if (this._frameBuffer)
        {
            gl.deleteFramebuffer(this._frameBuffer);
            this._frameBuffer = null;
        }

        this._internalFormat = null;
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
                    name: "Depth precision",
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
                            name: "Depth precision",
                            description: "Invalid depth for device, falling back to 16BIT"
                        });
                    }
                    precision = 16;
                    internalFormat = gl.DEPTH_COMPONENT16;
                    type = gl.UNSIGNED_SHORT;
            }
        }

        this.precision = precision;

        if (this._attached && !this._depthTexture)
        {
            throw new ReferenceError("Missing depth texture attachment");
        }
        else if (!this._attached && !this._depthTexture)
        {
            this._depthTexture = new Tw2TextureRes();
        }

        this._depthTexture.Attach(gl.createTexture());
        this._internalFormat = internalFormat;

        const
            res = this._depthTexture,
            depthTexture = res.texture;

        res._hasMipMaps = false;
        res._forceMipMaps = false;
        res._target = gl.TEXTURE_2D;
        res._internalFormat = internalFormat;
        res._width = this.width = width;
        res._height = this.height = height;
        res._type = type;

        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(
            res._target,
            0,
            res._internalFormat,
            res._width,
            res._height,
            0,
            gl.DEPTH_COMPONENT,
            res._type,
            null
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);


        if (!this._colorTexture) this._colorTexture = new Tw2TextureRes();
        this._colorTexture.Attach(gl.createTexture());

        const
            col = this._colorTexture,
            colorTexture = this._colorTexture.texture;

        col._hasMipMaps = false;
        col._forceMipMaps = false;
        col._target = gl.TEXTURE_2D;
        col._internalFormat = gl.RGBA;
        col._width = width;
        col._height = height;
        col._type = gl.UNSIGNED_BYTE;

        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texImage2D(
            col._target,
            0,
            col._internalFormat,
            col._width,
            col._height,
            0,
            gl.RGBA,
            col._type,
            null,
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
     * Sets the render target
     * @param {Object} [clearOptions]
     */
    Set(clearOptions)
    {
        if (!this.IsGood()) throw new Error("Invalid frame buffer");
        const { gl } = tw2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);

        if (clearOptions)
        {
            tw2.ClearBufferBits(clearOptions.clearColorBit, clearOptions.clearDepthBit, clearOptions.clearStencilBit);
            if (clearOptions.clearColor) tw2.SetClearColor(clearOptions.clearColor);
        }
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

    /**
     * Sets the render target, calls a method, then unsets the render target
     * @param {Function} func
     * @param {Boolean}
     */
    SetCallUnset(func)
    {
        if (!this.IsGood()) return false;

        const { gl, width, height } = tw2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.viewport(0, 0, this.width, this.height);
        func(this);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
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

        const { gl } = tw2;
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

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return uint8array;
    }

}
