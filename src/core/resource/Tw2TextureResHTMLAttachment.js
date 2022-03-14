import { isString, meta } from "utils/index";
import { Model } from "global/meta";
import { device } from "global/tw2";
import { ErrResourceFormatNotImplemented } from "./Tw2Resource";
import { Tw2TextureRes } from "./Tw2TextureRes";
import { TEX_2D, TEX_VOLUME, TEX_CUBE_MAP } from "constant/d3d";


@meta.type("Tw2TextureResHTMLAttachment")
export class Tw2TextureResHTMLAttachment extends Model
{

    @meta.string
    id = null;

    @meta.boolean
    update = false;

    @meta.uint
    target = TEX_2D;

    @meta.boolean
    enableMipMaps = false;

    _element = null;
    _res = null;
    _dirty = true;
    _lastActiveFrame = 0;

    /**
     * Initializes the object
     */
    Initialize()
    {
        if (this.id) this.OnValueChanged();
    }

    /**
     * Sets the attachments element or element id
     * @param value
     * @param opt
     */
    SetValue(value=null, opt)
    {
        if (value === null || isString(value))
        {
            if (this.id !== value)
            {
                this.id = value;
                this._element = null;
                this.UpdateValues(opt);
                return true;
            }
        }
        else if (this._element !== value)
        {
            this._id = value.id || null;
            this._element = value;
            this.UpdateValues(opt);
            return true;
        }

        return false;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        if (this.id) this._element = document.getElementById(this.id);
        this._dirty = true;
    }

    /**
     * Checks if the attachment is good
     * @returns {Boolean}
     */
    IsGood()
    {
        // TODO: Check for the correct type of element
        return !!(this._element && this._element.width && this._element.height);
    }

    /**
     * Updates a target texture resource
     * @param {Tw2TextureRes} res
     */
    UpdateTextureRes(res)
    {
        // Don't rebuild multiple times on teh same frame
        if (this._lastActiveFrame === res.activeFrame)
        {
            return;
        }

        // Only update if we have a visible element or an update is required
        if (!this.IsGood() || res.texture && !this.update && !this.dirty)
        {
            return;
        }

        const { gl, glVersion } = device;

        // Ensure the target texture is setup correctly
        if (!res.texture || this._dirty)
        {
            res.path = null;
            res._isAttached = true;
            res._internalFormat = gl.RGBA;
            res._format = gl.RGBA;
            res._type = gl.UNSIGNED_BYTE;
            res._isCube = false;
            res._hasMipMaps = false;
            res._width = this._element.width;
            res._height = this._element.height;
            res._isPowerOfTwo = Tw2TextureRes.IsPowerOfTwo(res._width, res._height);

            switch (this.target)
            {
                case TEX_2D:
                case TEX_VOLUME:
                    res._target = gl.TEXTURE_2D;
                    break;

                case TEX_CUBE_MAP:
                    res._target = gl.TEXTURE_CUBE_MAP;
                    res._isCube = true;
                    throw new ErrResourceFormatNotImplemented({ format: "HTML->CubeMap" });

                    /*
            case TEX_3D:
                res._target = gl.TEXTURE_3D;
                break;
                 */

                default:
                    throw new ReferenceError(`Invalid texture format ${this.target}`);
            }

            if (!res.texture)
            {
                res.texture = gl.createTexture();
            }

            this._dirty = false;
        }

        gl.bindTexture(res._target, res.texture);

        switch (this.target)
        {
            case TEX_2D:
            case TEX_VOLUME:
                if (glVersion === 1)
                {
                    gl.texImage2D(
                        res._target,
                        0,
                        res._internalFormat,
                        res._format,
                        res._type,
                        this._element
                    );
                }
                else
                {
                    gl.texImage2D(
                        res._target,
                        0,
                        res._internalFormat,
                        this._element.width,
                        this._element.height,
                        0,
                        res._format,
                        res._type,
                        this._element
                    );
                }
                break;

            case TEX_CUBE_MAP:
                // not implemented
                break;
        }

        // Build mip maps if we can
        if (this.enableMipMaps && glVersion !== 1 || res._isPowerOfTwo)
        {
            res._hasMipMaps = true;
            gl.generateMipmap(res._target);
        }

        gl.texParameteri(res._target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(res._target, gl.TEXTURE_MIN_FILTER, res._hasMipMaps ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR);
        gl.bindTexture(res._target, null);

        this._lastActiveFrame = res.activeFrame;
    }

}
