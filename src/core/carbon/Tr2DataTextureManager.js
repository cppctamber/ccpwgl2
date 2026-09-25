import { meta } from "utils";
import { device, tw2 } from "global";
import { Tw2TextureRes } from "../resource/Tw2TextureRes";


const WIDTH = 256;
const HEIGHT = 4;
const COMPONENTS = 4;


/**
 * Packs short-lived Carbon effect data into the global four-row float texture.
 *
 * A request occupies one header column followed by `blockLength` data columns.
 * Requests are packed by descending priority and remain addressable until the
 * following update, matching Carbon's Tr2DataTextureManager contract.
 */
@meta.define("Tr2DataTextureManager", true)
export class Tr2DataTextureManager extends meta.Model
{

    textureRes = null;
    textureParameter = null;

    _data = new Float32Array(WIDTH * HEIGHT * COMPONENTS);
    _requests = new Map();
    _offsets = new Map();
    _nextBlockID = 1;
    _initialized = false;

    /** Publishes Carbon's shared sampler before effects bind auto parameters. */
    constructor()
    {
        super();
        this.textureRes = new Tw2TextureRes();
        this.textureParameter = tw2.HasVariable("ImpactShieldDataMap")
            ? tw2.GetVariable("ImpactShieldDataMap")
            : tw2.SetVariable("ImpactShieldDataMap", "");
        this.textureParameter.AttachTextureRes(this.textureRes);
    }

    /** Creates and publishes the RGBA32F texture used by impact shaders. */
    Initialize()
    {
        if (this._initialized) return true;
        const gl = device.gl;
        if (!gl) return false;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            device.glVersion > 1 ? gl.RGBA32F : gl.RGBA,
            WIDTH,
            HEIGHT,
            0,
            gl.RGBA,
            gl.FLOAT,
            this._data
        );
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.textureRes.Attach(texture, "dynamic:/impactshielddatamap");
        this.textureRes._target = gl.TEXTURE_2D;
        this.textureRes._width = WIDTH;
        this.textureRes._height = HEIGHT;
        this.textureRes._type = gl.FLOAT;
        this.textureRes._format = gl.RGBA;
        this.textureRes._internalFormat = device.glVersion > 1 ? gl.RGBA32F : gl.RGBA;
        this.textureRes._forceNearest = true;
        this.textureRes._useNoMipFilter = true;
        this.textureRes._hasMipMaps = false;
        this.textureRes._mipCount = 1;
        this.textureRes._isPowerOfTwo = true;

        this._initialized = true;
        return true;
    }

    /**
     * Queues a block for the next texture upload.
     * @param {Array|Float32Array} headerData Four vec4 header rows
     * @param {Number} blockLength Number of data columns
     * @param {Array|Float32Array} blockData Data columns, each containing four vec4 rows
     * @param {Number} priority Larger values are packed first
     * @returns {Number} Stable request id, or -1 when inactive
     */
    RequestBlockData(headerData, blockLength, blockData, priority)
    {
        priority = Number(priority) || 0;
        blockLength = Math.max(0, Number(blockLength) | 0);
        if (priority <= 0 || blockLength + 1 >= WIDTH) return -1;

        const blockID = this._nextBlockID++;
        this._requests.set(blockID, {
            blockID,
            priority,
            blockLength,
            header: CopyVec4Rows(headerData, HEIGHT),
            data: CopyBlockColumns(blockData, blockLength)
        });
        return blockID;
    }

    /** Returns the column assigned to a request during the previous update. */
    GetTextureOffset(blockID)
    {
        return this._offsets.has(blockID) ? this._offsets.get(blockID) : -1;
    }

    /** Packs queued requests and uploads the complete texture. */
    Update()
    {
        if (!this.Initialize()) return false;
        const requests = Array.from(this._requests.values())
            .sort((a, b) => b.priority - a.priority || a.blockID - b.blockID);

        this._data.fill(0);
        this._offsets.clear();
        let pixelOffset = 0;
        for (const request of requests)
        {
            if (pixelOffset + request.blockLength + 1 >= WIDTH) continue;
            this._offsets.set(request.blockID, pixelOffset);
            for (let row = 0; row < HEIGHT; row++)
            {
                WriteVec4(this._data, row, pixelOffset, request.header, row * COMPONENTS);
                for (let column = 0; column < request.blockLength; column++)
                {
                    WriteVec4(
                        this._data,
                        row,
                        pixelOffset + 1 + column,
                        request.data,
                        (column * HEIGHT + row) * COMPONENTS
                    );
                }
            }
            pixelOffset += request.blockLength + 1;
        }
        this._requests.clear();

        const gl = device.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.textureRes.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WIDTH, HEIGHT, gl.RGBA, gl.FLOAT, this._data);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return true;
    }

    /** Releases the owned GL texture and pending CPU data. */
    Dispose()
    {
        this.textureParameter?._RemoveTextureRes?.();
        this.textureRes?.DeleteGL?.();
        this.textureParameter = null;
        this.textureRes = null;
        this._requests.clear();
        this._offsets.clear();
        this._initialized = false;
    }
}


function CopyVec4Rows(source, count)
{
    const out = new Float32Array(count * COMPONENTS);
    if (!source) return out;
    if (ArrayBuffer.isView(source)) out.set(source.subarray(0, out.length));
    else for (let row = 0; row < count; row++) out.set(source[row] || [ 0, 0, 0, 0 ], row * COMPONENTS);
    return out;
}


function CopyBlockColumns(source, count)
{
    const out = new Float32Array(count * HEIGHT * COMPONENTS);
    if (!source) return out;
    if (ArrayBuffer.isView(source)) out.set(source.subarray(0, out.length));
    else for (let column = 0; column < count; column++)
    {
        const rows = source[column] || [];
        for (let row = 0; row < HEIGHT; row++)
        {
            out.set(rows[row] || [ 0, 0, 0, 0 ], (column * HEIGHT + row) * COMPONENTS);
        }
    }
    return out;
}


function WriteVec4(destination, row, column, source, sourceOffset)
{
    destination.set(source.subarray(sourceOffset, sourceOffset + COMPONENTS),
        (row * WIDTH + column) * COMPONENTS);
}
