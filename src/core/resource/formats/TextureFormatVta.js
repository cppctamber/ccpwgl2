import { device, resMan } from "global";
import { CjsVtaFormat } from "@carbonenginejs/runtime/resource/formats/vta";
import { ErrResourceFormatUnsupported } from "../Tw2Resource";

/**
 * TextureFormatVta.js
 *
 * Carbon's Volume Texture Animation container (`.vta`) as a texture format
 * handler - `Tw2TextureRes` takes any extension through this seam, so a volume
 * needs no resource class of its own.
 *
 * The container holds one or more named 3D grids, each with a run of frames:
 * a header, then `GridInfo grids[]`, then `offsets[frame * gridCount + grid]`,
 * then metadata strings, then the frame blobs (`VtaHandler.h:36-49`). Every
 * blob is deflated, and the RLE7 family encodes each frame against the one
 * before it, so a frame can only be reached by walking from frame 0.
 *
 * Only grid 0 / frame 0 is uploaded here, which is Carbon's own static texture
 * path and what the runtime format defaults to. Animation is a separate job: it
 * needs a playback owner and a per-frame upload budget, and holding every frame
 * of a large grid decoded is measured in hundreds of megabytes.
 *
 * The decode is asynchronous - the blobs inflate through `DecompressionStream`
 * - and `Prepare` is not. So `Load` does the whole decode and queues the
 * finished grid; `Prepare` only uploads. That is why this handler queues a
 * decoded object where the others queue an ArrayBuffer.
 */
export class TextureFormatVta
{

    static formatName = "VTA";

    static exts = [ "vta" ];

    /**
     * @param {WebGLRenderingContext} gl
     * @returns {Object}
     */
    static GetSupport(gl)
    {
        // Two hard requirements, both absent on WebGL1: `texImage3D` for the
        // upload, and `DecompressionStream` for the frame blobs.
        const has3D = !!(gl && gl.texImage3D) && device.glVersion > 1;
        const hasInflate = typeof DecompressionStream !== "undefined";
        const supported = has3D && hasInflate;

        return {
            supported,
            partial: supported,
            declared: true,
            verified: false,
            reason: supported
                ? "Static volume only: grid 0, frame 0"
                : (has3D ? "DecompressionStream unavailable" : "Requires WebGL2 texImage3D"),
            formats: {
                vta: { declared: true, verified: false }
            }
        };
    }

    /**
     * Fetches and fully decodes the volume, then queues it for upload.
     * @param {Tw2TextureRes} res
     * @param {String} path
     * @returns {Boolean}
     */
    static Load(res, path)
    {
        resMan.FetchRaw(path, "arraybuffer")
            .then(async response =>
            {
                const decoded = await new CjsVtaFormat().ReadAsync(response, { emit: "volume" });
                const grid = decoded && decoded.grids && decoded.grids[0];

                if (!grid || !grid.frames || !grid.frames.length)
                {
                    throw new ErrResourceFormatUnsupported({
                        format: "VTA",
                        reason: "File declares no readable grid"
                    });
                }

                res.OnLoaded();
                resMan.Queue(res, grid);
            })
            .catch(err => res.OnError(err));

        return true;
    }

    /**
     * Uploads the decoded grid as a single-channel 3D texture.
     * @param {Tw2TextureRes} res
     * @param {WebGL2RenderingContext} gl
     * @param {Object} grid - the decoded grid queued by `Load`
     */
    static Prepare(res, gl, grid)
    {
        if (device.glVersion === 1 || !gl.texImage3D)
        {
            throw new ErrResourceFormatUnsupported({
                format: "VTA",
                reason: "Volume textures require WebGL2 texture3D support"
            });
        }

        const { width, height, depth } = grid;

        // The runtime decodes every grid to r8unorm, whatever the container
        // declared, so there is one upload shape rather than a format table.
        res._type = gl.UNSIGNED_BYTE;
        res._format = gl.RED;
        res._internalFormat = gl.R8;
        res._target = gl.TEXTURE_3D;

        // No mip chain in the container, and none generated: these are density
        // fields sampled volumetrically, and a generated chain would average
        // neighbouring voxels into a haze at distance.
        res._mipCount = 1;
        res._hasMipMaps = false;
        res._isCube = false;

        res._width = width;
        res._height = height;
        res._isPowerOfTwo = res.constructor.IsPowerOfTwo(width, height, depth);

        res._isVolumeAtlas = false;
        res._volumeAxis = "z";
        res._volumeSlices = depth;

        if (res._debugInfo)
        {
            res._debugInfo.output = {
                target: "TEXTURE_3D",
                type: "volume",
                name: grid.name,
                slices: depth,
                width,
                height,
                depth,
                frames: grid.frames.length,
                mipmaps: 1
            };
        }

        res.texture = gl.createTexture();
        gl.bindTexture(res._target, res.texture);

        // R8 rows are not 4-byte aligned unless the width happens to be.
        const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        try
        {
            gl.texImage3D(
                res._target,
                0,
                res._internalFormat,
                width,
                height,
                depth,
                0,
                res._format,
                res._type,
                grid.frames[0]
            );
        }
        finally
        {
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevUnpack);
        }

        gl.texParameteri(res._target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(res._target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(res._target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(res._target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(res._target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        gl.bindTexture(res._target, null);
    }

}
