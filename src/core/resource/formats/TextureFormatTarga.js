/**
 * TextureFormatTGA.js
 *
 * Single-file module:
 * - Targa decoder (merged into one class)
 * - TextureFormatTGA handler (matches the TextureFormat standard: static exts/Load/Prepare)
 *
 * Keep this file self-contained so TGA logic never leaks elsewhere.
 */

/* =======================================================================
 * Targa decoder (merged)
 * Original: jsTGALoader - Vincent Thibault (BSD-style license)
 * ======================================================================= */

/* Copyright (c) 2013, Vincent Thibault. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

import { device, resMan } from "global";

/**
 * TGA decoder (single class)
 */
class Targa
{
    /**
     * @param {{strictPalette24?: boolean}=} opt
     */
    constructor(opt = {})
    {
        /** @type {*} */
        this.header = null;
        /** @type {Uint8Array|null} */
        this.imageData = null;
        /** @type {Uint8Array|null} */
        this.palette = null;

        // Keep original behavior by default
        this._strictPalette24 = opt.strictPalette24 !== false;
    }

    static Type = {
        NO_DATA: 0,
        INDEXED: 1,
        RGB: 2,
        GREY: 3,
        RLE_INDEXED: 9,
        RLE_RGB: 10,
        RLE_GREY: 11
    };

    static Origin = {
        BOTTOM_LEFT: 0x00,
        BOTTOM_RIGHT: 0x01,
        TOP_LEFT: 0x02,
        TOP_RIGHT: 0x03,
        SHIFT: 0x04,
        MASK: 0x30
    };

    /**
     * Load and parse a TGA file
     * @param {Uint8Array} data
     */
    load(data)
    {
        let offset = 0;

        if (data.length < 0x12)
        {
            throw new Error("Targa::load() - Not enough data to contain header");
        }

        this.header = {
            /* 0x00 */ idLength: data[offset++],
            /* 0x01 */ colorMapType: data[offset++],
            /* 0x02 */ imageType: data[offset++],
            /* 0x03 */ colorMapIndex: data[offset++] | (data[offset++] << 8),
            /* 0x05 */ colorMapLength: data[offset++] | (data[offset++] << 8),
            /* 0x07 */ colorMapDepth: data[offset++],
            /* 0x08 */ offsetX: data[offset++] | (data[offset++] << 8),
            /* 0x0A */ offsetY: data[offset++] | (data[offset++] << 8),
            /* 0x0C */ width: data[offset++] | (data[offset++] << 8),
            /* 0x0E */ height: data[offset++] | (data[offset++] << 8),
            /* 0x10 */ pixelDepth: data[offset++],
            /* 0x11 */ flags: data[offset++]
        };

        this.header.hasEncoding =
            this.header.imageType === Targa.Type.RLE_INDEXED ||
            this.header.imageType === Targa.Type.RLE_RGB ||
            this.header.imageType === Targa.Type.RLE_GREY;

        this.header.hasColorMap =
            this.header.imageType === Targa.Type.RLE_INDEXED ||
            this.header.imageType === Targa.Type.INDEXED;

        this.header.isGreyColor =
            this.header.imageType === Targa.Type.RLE_GREY ||
            this.header.imageType === Targa.Type.GREY;

        this._checkHeader(this.header);

        offset += this.header.idLength;
        if (offset >= data.length)
        {
            throw new Error("Targa::load() - No data");
        }

        // Palette
        this.palette = null;
        if (this.header.hasColorMap)
        {
            const colorMapSize = this.header.colorMapLength * (this.header.colorMapDepth >> 3);
            this.palette = data.subarray(offset, offset + colorMapSize);
            offset += colorMapSize;
        }

        const pixelSize = this.header.pixelDepth >> 3;
        const imageSize = this.header.width * this.header.height;
        const pixelTotal = imageSize * pixelSize;

        if (this.header.hasEncoding)
        {
            this.imageData = this._decodeRLE(data, offset, pixelSize, pixelTotal);
        }
        else
        {
            this.imageData = data.subarray(
                offset,
                offset + (this.header.hasColorMap ? imageSize : pixelTotal)
            );
        }
    }

    _checkHeader(header)
    {
        if (header.imageType === Targa.Type.NO_DATA)
        {
            throw new Error("Targa::checkHeader() - No data");
        }

        if (header.hasColorMap)
        {
            if (header.colorMapLength > 256 || header.colorMapType !== 1)
            {
                throw new Error("Targa::checkHeader() - Invalid colormap for indexed type");
            }

            if (this._strictPalette24 && header.colorMapDepth !== 24)
            {
                throw new Error("Targa::checkHeader() - Invalid colormap depth (expected 24)");
            }
        }
        else
        {
            if (header.colorMapType)
            {
                throw new Error("Targa::checkHeader() - Why does the image contain a palette ?");
            }
        }

        if (header.width <= 0 || header.height <= 0)
        {
            throw new Error("Targa::checkHeader() - Invalid image size");
        }

        if (header.pixelDepth !== 8 &&
            header.pixelDepth !== 16 &&
            header.pixelDepth !== 24 &&
            header.pixelDepth !== 32)
        {
            throw new Error(`Targa::checkHeader() - Invalid pixel size "${header.pixelDepth}"`);
        }
    }

    _decodeRLE(data, offset, pixelSize, outputSize)
    {
        let pos = 0;
        const output = new Uint8Array(outputSize);
        const pixels = new Uint8Array(pixelSize);

        while (pos < outputSize)
        {
            const c = data[offset++];
            let count = (c & 0x7f) + 1;

            if (c & 0x80)
            {
                for (let i = 0; i < pixelSize; ++i)
                {
                    pixels[i] = data[offset++];
                }

                for (let i = 0; i < count; ++i)
                {
                    output.set(pixels, pos);
                    pos += pixelSize;
                }
            }
            else
            {
                count *= pixelSize;
                for (let i = 0; i < count; ++i)
                {
                    output[pos++] = data[offset++];
                }
            }
        }

        return output;
    }

    /**
     * Returns an ImageData-like object (DOM ImageData if possible, else plain object)
     * @param {ImageData|{width:number,height:number,data:Uint8ClampedArray}|null=} imageData
     */
    getImageData(imageData = null)
    {
        const width = this.header.width;
        const height = this.header.height;

        const origin = (this.header.flags & Targa.Origin.MASK) >> Targa.Origin.SHIFT;

        let x_start, x_step, x_end;
        let y_start, y_step, y_end;

        if (!imageData)
        {
            if (typeof document !== "undefined" && document?.createElement)
            {
                imageData = document.createElement("canvas").getContext("2d").createImageData(width, height);
            }
            else
            {
                imageData = { width, height, data: new Uint8ClampedArray(width * height * 4) };
            }
        }

        // Y direction
        if (origin === Targa.Origin.TOP_LEFT || origin === Targa.Origin.TOP_RIGHT)
        {
            y_start = 0; y_step = 1; y_end = height;
        }
        else
        {
            y_start = height - 1; y_step = -1; y_end = -1;
        }

        // X direction
        if (origin === Targa.Origin.TOP_LEFT || origin === Targa.Origin.BOTTOM_LEFT)
        {
            x_start = 0; x_step = 1; x_end = width;
        }
        else
        {
            x_start = width - 1; x_step = -1; x_end = -1;
        }

        let writer;
        switch (this.header.pixelDepth)
        {
            case 8:  writer = this.header.isGreyColor ? this._writeGrey8 : this._writeIndexed8; break;
            case 16: writer = this.header.isGreyColor ? this._writeGrey16 : this._write16; break;
            case 24: writer = this._write24; break;
            case 32: writer = this._write32; break;
            default: throw new Error("Targa::getImageData() - Unsupported pixel depth");
        }

        writer.call(
            this,
            imageData.data,
            this.imageData,
            this.palette,
            width,
            y_start, y_step, y_end,
            x_start, x_step, x_end
        );

        return imageData;
    }

    /**
     * Engine-friendly: returns RGBA8 bytes
     * @returns {{width:number,height:number,bytes:Uint8Array}}
     */
    getRGBA8()
    {
        const img = this.getImageData(null);
        const bytes = new Uint8Array(img.data.length);
        bytes.set(img.data);
        return { width: img.width || this.header.width, height: img.height || this.header.height, bytes };
    }

    // Writers
    _writeIndexed8(imageData, indexes, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
    {
        let color, i, x, y;

        for (i = 0, y = y_start; y !== y_end; y += y_step)
        {
            for (x = x_start; x !== x_end; x += x_step, i++)
            {
                color = indexes[i];
                const di = (x + width * y) * 4;

                imageData[di + 3] = 255;
                imageData[di + 2] = colormap[(color * 3) + 0];
                imageData[di + 1] = colormap[(color * 3) + 1];
                imageData[di + 0] = colormap[(color * 3) + 2];
            }
        }
        return imageData;
    }

    _write16(imageData, pixels, _colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
    {
        let color, i, x, y;

        for (i = 0, y = y_start; y !== y_end; y += y_step)
        {
            for (x = x_start; x !== x_end; x += x_step, i += 2)
            {
                color = pixels[i + 0] | (pixels[i + 1] << 8);
                const di = (x + width * y) * 4;

                imageData[di + 0] = (color & 0x7C00) >> 7;
                imageData[di + 1] = (color & 0x03E0) >> 2;
                imageData[di + 2] = (color & 0x001F) >> 3;
                imageData[di + 3] = (color & 0x8000) ? 0 : 255;
            }
        }
        return imageData;
    }

    _write24(imageData, pixels, _colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
    {
        let i, x, y;

        for (i = 0, y = y_start; y !== y_end; y += y_step)
        {
            for (x = x_start; x !== x_end; x += x_step, i += 3)
            {
                const di = (x + width * y) * 4;

                imageData[di + 3] = 255;
                imageData[di + 2] = pixels[i + 0];
                imageData[di + 1] = pixels[i + 1];
                imageData[di + 0] = pixels[i + 2];
            }
        }
        return imageData;
    }

    _write32(imageData, pixels, _colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
    {
        let i, x, y;

        for (i = 0, y = y_start; y !== y_end; y += y_step)
        {
            for (x = x_start; x !== x_end; x += x_step, i += 4)
            {
                const di = (x + width * y) * 4;

                imageData[di + 2] = pixels[i + 0];
                imageData[di + 1] = pixels[i + 1];
                imageData[di + 0] = pixels[i + 2];
                imageData[di + 3] = pixels[i + 3];
            }
        }
        return imageData;
    }

    _writeGrey8(imageData, pixels, _colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
    {
        let color, i, x, y;

        for (i = 0, y = y_start; y !== y_end; y += y_step)
        {
            for (x = x_start; x !== x_end; x += x_step, i++)
            {
                color = pixels[i];
                const di = (x + width * y) * 4;

                imageData[di + 0] = color;
                imageData[di + 1] = color;
                imageData[di + 2] = color;
                imageData[di + 3] = 255;
            }
        }
        return imageData;
    }

    _writeGrey16(imageData, pixels, _colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
    {
        let i, x, y;

        for (i = 0, y = y_start; y !== y_end; y += y_step)
        {
            for (x = x_start; x !== x_end; x += x_step, i += 2)
            {
                const di = (x + width * y) * 4;
                const lum = pixels[i + 0];
                const a = pixels[i + 1];

                imageData[di + 0] = lum;
                imageData[di + 1] = lum;
                imageData[di + 2] = lum;
                imageData[di + 3] = a;
            }
        }
        return imageData;
    }
}

/* =======================================================================
 * TextureFormatTGA (standard handler)
 * ======================================================================= */

function detectVerticalAtlas(width, height)
{
    if (width > 0 && height % width === 0)
    {
        const slices = height / width;
        if (slices >= 2) return { isAtlas: true, axis: "y", slices };
    }
    return { isAtlas: false, axis: "y", slices: 1 };
}

export class TextureFormatTarga
{
    static formatName = "targa";

    static exts = [ "tga" ];

    static GetSupport()
    {
        return {
            supported: true,
            partial: false,
            declared: true,
            verified: true,
            fallback: "png",
            formats: {
                tga: { declared: true, verified: true }
            }
        };
    }

    /**
     * @param {Tw2TextureRes} res
     * @param {string} path
     * @returns {boolean}
     */
    static Load(res, path)
    {
        resMan.FetchRaw(path, "arraybuffer")
            .then(response =>
            {
                res.OnLoaded();
                resMan.Queue(res, response);
            })
            .catch(err => res.OnError(err));

        return true;
    }

    /**
     * @param {Tw2TextureRes} res
     * @param {WebGLRenderingContext} gl
     * @param {ArrayBuffer} arrayBuffer
     */
    static Prepare(res, gl, arrayBuffer)
    {
        const tga = new Targa();
        tga.load(new Uint8Array(arrayBuffer));
        const { width, height, bytes } = tga.getRGBA8();

        const isWebGL2 = device.glVersion > 1;

        res._target = gl.TEXTURE_2D;
        res._isCube = false;

        res._width = width;
        res._height = height;
        res._isPowerOfTwo = res.constructor.IsPowerOfTwo(width, height);

        const atlas = detectVerticalAtlas(width, height);
        if (atlas.isAtlas)
        {
            res._isVolumeAtlas = true;
            res._volumeAxis = atlas.axis;
            res._volumeSlices = atlas.slices;
        }

        res._type = gl.UNSIGNED_BYTE;
        res._format = gl.RGBA;
        res._internalFormat = (isWebGL2 && res._isSRGB) ? gl.SRGB8_ALPHA8 : gl.RGBA;

        res._mipCount = 1;
        res._hasMipMaps = false;
        res._useNoMipFilter = false;

        res.texture = gl.createTexture();
        gl.bindTexture(res._target, res.texture);

        const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            bytes
        );

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevUnpack);

        if (res._isPowerOfTwo || isWebGL2)
        {
            gl.generateMipmap(res._target);
            res._hasMipMaps = true;
            res._mipCount = 2; // marker
        }

        gl.bindTexture(res._target, null);
    }
}
