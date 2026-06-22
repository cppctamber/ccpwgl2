import { device, resMan } from "global";
import { ErrHTTPRequest } from "../../engine/Tw2ResMan";
import { VolumeAtlas } from "../transforms/VolumeAtlas";

export const TextureFormatImage =
    {
        exts: [
            "png",
            "cube",
            "qube",
            "jpg",
            "jpeg",
            "webp",
            "avif"
        ],

        Load(res, path)
        {
            resMan.AddPendingLoad(path);

            const image = new Image();
            image.crossOrigin = "anonymous";

            image.onerror = () =>
            {
                resMan.RemovePendingLoad(path);
                res.OnError(new ErrHTTPRequest({ path }));
            };

            image.onload = () =>
            {
                resMan.RemovePendingLoad(path);
                resMan.Queue(res, image);
                res.OnLoaded();
            };

            image.src = path;
            return true;
        },

        Prepare(res, gl, data)
        {
            const isWebGL2 = device.glVersion > 1;
            const hintedInternal = (data && "ccpGLFormat" in data) ? data.ccpGLFormat : null;

            res._internalFormat = hintedInternal ?? ((isWebGL2 && res._isSRGB) ? gl.SRGB8_ALPHA8 : gl.RGBA);
            res._format = gl.RGBA;
            res._type = gl.UNSIGNED_BYTE;

            // 2D
            if (!res._isCube || res._extension !== "cube")
            {
                res._target = gl.TEXTURE_2D;
                res._width = data.width;
                res._height = data.height;
                res._isPowerOfTwo = (res._width & (res._width - 1)) === 0 && (res._height & (res._height - 1)) === 0;

                const atlas = VolumeAtlas.Detect2DAtlas(res._width, res._height);
                if (atlas.isAtlas)
                {
                    res._isVolumeAtlas = true;
                    res._volumeAxis = atlas.axis;
                    res._volumeSlices = atlas.slices;
                }

                res.texture = gl.createTexture();
                gl.bindTexture(res._target, res.texture);
                gl.texImage2D(res._target, 0, res._internalFormat, res._format, res._type, data);

                if (res._isPowerOfTwo || isWebGL2)
                {
                    gl.generateMipmap(res._target);
                    res._hasMipMaps = true;
                    res._mipCount = Math.max(res._mipCount, 2);
                }
                else
                {
                    res._hasMipMaps = false;
                    res._mipCount = 1;
                }

                gl.bindTexture(res._target, null);
                return;
            }

            // Cube strip (6 faces laid out horizontally)
            res._isCube = true;
            res._target = gl.TEXTURE_CUBE_MAP;
            res._width = res._height = data.height;
            res._isPowerOfTwo = (res._width & (res._width - 1)) === 0;

            res.texture = gl.createTexture();
            gl.bindTexture(res._target, res.texture);

            const size = data.height;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");

            for (let j = 0; j < 6; ++j)
            {
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(data, j * size, 0, size, size, 0, 0, size, size);
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, res._internalFormat, res._format, res._type, canvas);
            }

            if (res._isPowerOfTwo || isWebGL2) gl.generateMipmap(res._target);

            res._hasMipMaps = true;
            res._mipCount = Math.max(res._mipCount, 2);

            gl.bindTexture(res._target, null);
        }
    };
