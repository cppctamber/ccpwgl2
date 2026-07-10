const { CewgLightCuller } = require("./CewgLightCuller");

/**
 * CewgLightList
 *
 * CPU-side light-list data module for ccpwgl's CEWG (translated DX11)
 * shader path. Builds the two structured buffers the translated pixel
 * shaders read as tiled-forward light lists, emulated here as plain
 * typed-array "data textures" (RGBA32UI). This module is pure
 * typed-array/math logic - no GL calls, no ccpwgl "utils"/"global"
 * aliases - so it runs directly under plain node as well as under
 * webpack.
 *
 * DATA CONTRACT (reverse-engineered from shipped DX11 shader bytecode -
 * this layout is fixed; do not redesign it here):
 *
 * Buffer A - "light index buffer" (flat uint32 elements, exposed as an
 * RGBA32UI texture of fixed width `textureWidth`, 4 elements per texel):
 *   - Element 0 is reserved: value 0 always means "empty / terminate",
 *     both as a tile header (no lights) and as a list node's `next`
 *     (end of chain). No real list node may ever be placed at element 0.
 *   - Tile headers: tile (tx, ty) header lives at element
 *     `(ty * tilesPerRow + tx) * 3`. Slot +0 is the head node index (or
 *     0 for none). Slots +1 and +2 are reserved by the shader for
 *     unknown consumers - this module always writes them as 0.
 *   - `tilesPerRow = (uint(screenWidth) + 15) >> 4`,
 *     `tilesPerCol = (uint(screenHeight) + 15) >> 4` (16px tiles).
 *   - A list node is two consecutive elements:
 *     `A[nodeIndex] = lightIndex` (1-based index into Buffer B),
 *     `A[nodeIndex + 1] = next node's element index, or 0 to terminate`.
 *   - Shader traversal:
 *     `cursor = A[tileIndex * 3];`
 *     `while (cursor != 0) { lightIndex = A[cursor]; shade(B[lightIndex]); cursor = A[cursor + 1]; }`
 *     The visit count is emergent from the chain - there is no stored count.
 *
 * Buffer B - "light data buffer" (3 vec4s / 12 floats / 48 bytes per
 * light, exposed as an RGBA32UI texture, 3 texels per light):
 *   - row0: position.xyz, radius (w)
 *   - row1: color.rgb, packedInnerRadiusAndFlags (w) - a raw uint32 BIT PATTERN
 *     stored in the float slot. Carbon packs innerRadius as a float16 in
 *     the low 16 bits and PerLightData.flags in the high 16 bits, so
 *     FLAG_AFFECTS_SURFACES (1) appears to shaders as bit 0x10000.
 *     This module writes/reads the packed word through a Uint32Array
 *     view aliasing the same buffer as the Float32Array view - it is
 *     never round-tripped through a float, which would corrupt bit
 *     patterns.
 *   - row2: params (4 floats, effect-specific passthrough).
 *
 * *** LIGHT INDEX 0 IN BUFFER B IS RESERVED AS THE NULL LIGHT. ***
 * Real lights occupy Buffer B indices 1..maxLights. The null light is
 * always all-zero (radius 0, flags 0 = disabled), so if the shader ever
 * shades it, the shader's own `dist < radius` / enabled-bit tests reject
 * it and it contributes nothing.
 *
 * RUNTIME STRATEGY - the "shared list" trick:
 * Every tile header points at the SAME shared chain (the "list region",
 * placed immediately after the header region in Buffer A). Because every
 * header holds the identical value `listBase`, headers only depend on
 * screen resolution and are written once per `SetScreenSize` call, not
 * once per draw. Per draw, `WriteDrawList` writes up to `maxLights` list
 * nodes as one contiguous chain starting at `listBase`:
 *   node i @ `listBase + i*2` = [lightIndex_i, next = listBase + (i+1)*2]
 *   last node's `next` = 0.
 *
 * The empty-draw (K=0) case is the subtle part: headers always point at
 * `listBase`, so an empty draw cannot simply "point headers elsewhere"
 * without making headers per-draw again (defeating the whole trick).
 * Instead, `WriteDrawList([])` writes a single "gate" node at `listBase`:
 * `A[listBase] = 0` (the null light index), `A[listBase + 1] = 0`
 * (terminate immediately). Every tile's traversal visits exactly one
 * node, reads the null light (index 0, radius 0, flags 0 = disabled),
 * contributes nothing, and stops. This is the only reason Buffer B index
 * 0 must be permanently reserved as an all-zero null light - it is what
 * makes K=0 expressible as "one node" instead of requiring headers to be
 * rewritten per draw.
 */
class CewgLightList
{

    /**
     * Constructs a CewgLightList
     * @param {object} [options]
     * @param {number} [options.maxLights=254] maximum number of real lights (Buffer B indices 1..maxLights)
     * @param {number} [options.textureWidth=2048] fixed texel width used for both emulated RGBA32UI textures
     */
    constructor(options = {})
    {
        this.maxLights = options.maxLights || CewgLightList.DEFAULT_MAX_LIGHTS;
        this.textureWidth = options.textureWidth || CewgLightList.DEFAULT_TEXTURE_WIDTH;

        // Buffer A (light index buffer) state - allocated by SetScreenSize.
        this._tilesPerRow = 0;
        this._tilesPerCol = 0;
        this._headerElementCount = 0;
        this._listBase = 0;
        this._elementCount = 0;
        this._bufferA = null;
        this._bufferATexelCount = 0;
        this._bufferAHeight = 0;
        this._dirtyA = null;

        // Buffer B (light data buffer) state - fixed size, allocated now.
        this._bufferBFloat = null;
        this._bufferBUint = null;
        this._bufferBElementCount = 0;
        this._bufferBTexelCount = 0;
        this._bufferBHeight = 0;
        this._dirtyB = null;

        this._allocateBufferB();
    }

    /**
     * Allocates Buffer B's backing storage (fixed size, independent of screen size)
     *
     * A single ArrayBuffer backs both a Float32Array view (for
     * position/radius/color/params) and a Uint32Array view (for reading
     * and writing the raw flags bit pattern, and for texture upload).
     * Storage is padded to whole texture rows of `textureWidth` texels,
     * 4 elements (one RGBA32UI texel) at a time. Index 0 (the null
     * light) is left all-zero by the typed array's own zero-initialization.
     * @private
     */
    _allocateBufferB()
    {
        const totalFloats = (this.maxLights + 1) * CewgLightList.FLOATS_PER_LIGHT;
        const texelCount = Math.ceil(totalFloats / 4);
        const height = Math.max(1, Math.ceil(texelCount / this.textureWidth));
        const paddedElementCount = this.textureWidth * height * 4;

        this._bufferBElementCount = totalFloats;
        this._bufferBTexelCount = texelCount;
        this._bufferBHeight = height;

        const buffer = new ArrayBuffer(paddedElementCount * 4);
        this._bufferBFloat = new Float32Array(buffer);
        this._bufferBUint = new Uint32Array(buffer);
    }

    /**
     * Sets the screen size and rebuilds the Buffer A header region if the tile layout changed
     *
     * Tile headers always point at the shared list region (`listBase`),
     * so this only needs to run once per resize, not once per draw. If
     * the tile layout changes, Buffer A is fully reallocated (its size
     * and `listBase` both depend on tile count) and the list region is
     * reset to the empty (K=0) gate node - callers MUST call
     * `WriteDrawList` again after a layout change before the next draw.
     * @param {number} width screen width in pixels (the value the runtime puts in cb2[17].x)
     * @param {number} height screen height in pixels
     * @returns {boolean} true if the index buffer layout (and therefore listBase) changed
     */
    SetScreenSize(width, height)
    {
        // Ceiling-divide by the 16px tile size. Clamp to a minimum of one
        // tile so `listBase` (and therefore the header region) can never
        // collapse to 0, which would collide with the reserved element 0.
        const tilesPerRow = Math.max(1, (Math.trunc(width) + 15) >> 4);
        const tilesPerCol = Math.max(1, (Math.trunc(height) + 15) >> 4);

        if (this._bufferA && tilesPerRow === this._tilesPerRow && tilesPerCol === this._tilesPerCol)
        {
            return false;
        }

        this._tilesPerRow = tilesPerRow;
        this._tilesPerCol = tilesPerCol;
        this._headerElementCount = tilesPerRow * tilesPerCol * CewgLightList.ELEMENTS_PER_HEADER;
        this._listBase = this._headerElementCount;
        this._elementCount = this._listBase + this.maxLights * CewgLightList.ELEMENTS_PER_NODE;

        const texelCount = Math.ceil(this._elementCount / 4);
        const height2 = Math.max(1, Math.ceil(texelCount / this.textureWidth));
        this._bufferATexelCount = texelCount;
        this._bufferAHeight = height2;
        this._bufferA = new Uint32Array(this.textureWidth * height2 * 4);

        // Every tile header points at the shared list region. Slots +1
        // and +2 are reserved for unknown shader consumers - write 0.
        const tileCount = tilesPerRow * tilesPerCol;
        for (let t = 0; t < tileCount; t++)
        {
            const base = t * CewgLightList.ELEMENTS_PER_HEADER;
            this._bufferA[base] = this._listBase;
            this._bufferA[base + 1] = 0;
            this._bufferA[base + 2] = 0;
        }

        // Reset the (now relocated) list region to the empty gate node so
        // the buffer is always internally consistent immediately after a
        // layout change, even before the caller issues a draw.
        this._bufferA[this._listBase] = 0;
        this._bufferA[this._listBase + 1] = 0;

        this._dirtyA = null;
        this._markDirtyA(0, this._bufferA.length - 1);
        return true;
    }

    /**
     * Writes the shared draw-list chain into Buffer A's list region
     *
     * `lightIndices` are 1-based Buffer B indices (as produced by
     * `CullLights`, or authored directly). An empty array writes the
     * single "gate" node `[0, 0]` at `listBase`: every tile's traversal
     * then visits exactly the null light (Buffer B index 0, always
     * radius 0 / flags 0 = disabled) once and stops, which shades
     * nothing - the correct behaviour for zero effective lights.
     * @param {number[]} lightIndices 1-based Buffer B light indices, in shading order
     */
    WriteDrawList(lightIndices)
    {
        if (!this._bufferA)
        {
            throw new Error("CewgLightList.WriteDrawList: SetScreenSize must be called before WriteDrawList");
        }
        if (!Array.isArray(lightIndices))
        {
            throw new Error("CewgLightList.WriteDrawList: lightIndices must be an array");
        }

        const count = lightIndices.length;
        if (count > this.maxLights)
        {
            throw new Error(
                `CewgLightList.WriteDrawList: draw list length ${count} exceeds maxLights (${this.maxLights})`
            );
        }

        if (count === 0)
        {
            this._bufferA[this._listBase] = 0;
            this._bufferA[this._listBase + 1] = 0;
            this._markDirtyA(this._listBase, this._listBase + 1);
            return;
        }

        for (let i = 0; i < count; i++)
        {
            const lightIndex = lightIndices[i];
            if (!Number.isInteger(lightIndex) || lightIndex < 1 || lightIndex > this.maxLights)
            {
                throw new Error(
                    `CewgLightList.WriteDrawList: light index ${lightIndex} out of range [1, ${this.maxLights}] (index 0 is the reserved null light)`
                );
            }

            const nodeIndex = this._listBase + i * CewgLightList.ELEMENTS_PER_NODE;
            this._bufferA[nodeIndex] = lightIndex;
            this._bufferA[nodeIndex + 1] = i < count - 1
                ? this._listBase + (i + 1) * CewgLightList.ELEMENTS_PER_NODE
                : 0;
        }

        this._markDirtyA(this._listBase, this._listBase + count * CewgLightList.ELEMENTS_PER_NODE - 1);
    }

    /**
     * Writes Buffer B light rows, starting at index 1 (index 0 is the reserved null light)
     * @param {Array<{position:number[], radius:number, color:number[], flags:number, innerRadius?:number, params:number[]}>} lights
     */
    SetLights(lights)
    {
        if (!Array.isArray(lights))
        {
            throw new Error("CewgLightList.SetLights: lights must be an array");
        }
        if (lights.length > this.maxLights)
        {
            throw new Error(
                `CewgLightList.SetLights: ${lights.length} lights exceeds capacity of ${this.maxLights}`
            );
        }

        for (let i = 0; i < lights.length; i++)
        {
            this._writeLight(i + 1, lights[i]);
        }

        if (lights.length > 0)
        {
            const start = CewgLightList.FLOATS_PER_LIGHT;
            const end = (lights.length + 1) * CewgLightList.FLOATS_PER_LIGHT - 1;
            this._markDirtyB(start, end);
        }
    }

    /**
     * Writes a single Buffer B light row
     * @param {number} index 1-based Buffer B index (never 0 - that is the reserved null light)
     * @param {{position:number[], radius:number, color:number[], flags:number, innerRadius?:number, params:number[]}} light
     * @private
     */
    _writeLight(index, light)
    {
        const base = index * CewgLightList.FLOATS_PER_LIGHT;
        const f = this._bufferBFloat;

        const position = light.position || [ 0, 0, 0 ];
        f[base] = position[0];
        f[base + 1] = position[1];
        f[base + 2] = position[2];
        f[base + 3] = light.radius || 0;

        const color = light.color || [ 0, 0, 0 ];
        f[base + 4] = color[0];
        f[base + 5] = color[1];
        f[base + 6] = color[2];

        const params = light.params || [ 0, 0, 0, 0 ];

        // Carbon's PerLightData stores row1.w as one packed uint32:
        // low 16 bits = innerRadius float16, high 16 bits = uint16 flags.
        // Existing ccpwgl producers historically passed the already-shifted
        // 0x10000 enabled bit, so accept both raw Carbon flags (1) and the
        // legacy high-half representation (0x10000).
        const rawFlags = (light.flags || 0) >>> 0;
        const flagsHigh = rawFlags <= 0xFFFF ? (rawFlags << 16) >>> 0 : rawFlags & 0xFFFF0000;
        const innerRadius = light.innerRadius !== undefined ? light.innerRadius : params[0];
        this._bufferBUint[base + 7] = flagsHigh | Float32ToFloat16Bits(innerRadius || 0);

        f[base + 8] = params[0];
        f[base + 9] = params[1];
        f[base + 10] = params[2];
        f[base + 11] = params[3];
    }

    /**
     * Culls and ranks a light array against a bounding sphere, returning 1-based Buffer B indices
     *
     * Thin pass-through to `CewgLightCuller.Cull` - see that module for
     * the contribution heuristic. The result is ready to pass directly
     * to `WriteDrawList`.
     * @param {Array<{position:number[], radius:number}>} lights source light array (0-based, same order as SetLights)
     * @param {number[]} center [x, y, z] bounding sphere centre to cull against
     * @param {number} boundingRadius bounding sphere radius to cull against
     * @param {number} [maxCount] optional cap on the number of returned indices
     * @returns {number[]} 1-based light indices, sorted by descending contribution
     */
    CullLights(lights, center, boundingRadius, maxCount)
    {
        return CewgLightCuller.Cull(lights, center, boundingRadius, maxCount);
    }

    /**
     * Gets the element index of a tile's header (slot 0 of 3)
     * @param {number} tx tile x coordinate
     * @param {number} ty tile y coordinate
     * @returns {number}
     */
    GetTileHeaderIndex(tx, ty)
    {
        return (ty * this._tilesPerRow + tx) * CewgLightList.ELEMENTS_PER_HEADER;
    }

    /**
     * Gets the number of 16px tiles per row for the current screen size
     * @returns {number}
     */
    GetTilesPerRow()
    {
        return this._tilesPerRow;
    }

    /**
     * Gets the number of 16px tiles per column for the current screen size
     * @returns {number}
     */
    GetTilesPerCol()
    {
        return this._tilesPerCol;
    }

    /**
     * Gets the element index of the shared list region (all tile headers point here)
     * @returns {number}
     */
    GetListBase()
    {
        return this._listBase;
    }

    /**
     * Gets the number of meaningful (non-padding) elements in Buffer A
     * @returns {number}
     */
    GetElementCount()
    {
        return this._elementCount;
    }

    /**
     * Gets Buffer A's backing store
     *
     * The array IS the RGBA32UI texture data: 4 consecutive uint32
     * elements form one texel (element `e` -> texel `e >> 2`, channel
     * `e & 3`), rows are `textureWidth` texels wide, and the array is
     * padded with zeros to a whole number of rows.
     * @returns {Uint32Array}
     */
    GetBufferA()
    {
        return this._bufferA;
    }

    /**
     * Gets Buffer A's texture-shaped metadata
     * @returns {{width:number, height:number, texelCount:number, elementCount:number}}
     */
    GetBufferATextureInfo()
    {
        return {
            width: this.textureWidth,
            height: this._bufferAHeight,
            texelCount: this._bufferATexelCount,
            elementCount: this._elementCount
        };
    }

    /**
     * Reads one Buffer A texel as a 4-element view [r, g, b, a]
     * @param {number} x texel x coordinate
     * @param {number} y texel y coordinate
     * @returns {Uint32Array} a 4-element subarray view (not a copy)
     */
    ReadBufferATexel(x, y)
    {
        const texelIndex = y * this.textureWidth + x;
        const offset = texelIndex * 4;
        return this._bufferA.subarray(offset, offset + 4);
    }

    /**
     * Gets Buffer B's raw uint32 bit-pattern view (what a GL layer would upload as RGBA32UI)
     * @returns {Uint32Array}
     */
    GetBufferBUint()
    {
        return this._bufferBUint;
    }

    /**
     * Gets Buffer B's float view (position/radius/color/params share this buffer with the uint view)
     * @returns {Float32Array}
     */
    GetBufferBFloat()
    {
        return this._bufferBFloat;
    }

    /**
     * Gets Buffer B's texture-shaped metadata
     * @returns {{width:number, height:number, texelCount:number, lightCount:number}}
     */
    GetBufferBTextureInfo()
    {
        return {
            width: this.textureWidth,
            height: this._bufferBHeight,
            texelCount: this._bufferBTexelCount,
            lightCount: this.maxLights + 1
        };
    }

    /**
     * Reads one Buffer B texel as a 4-element view [r, g, b, a] (raw uint32 bits)
     * @param {number} x texel x coordinate
     * @param {number} y texel y coordinate
     * @returns {Uint32Array} a 4-element subarray view (not a copy)
     */
    ReadBufferBTexel(x, y)
    {
        const texelIndex = y * this.textureWidth + x;
        const offset = texelIndex * 4;
        return this._bufferBUint.subarray(offset, offset + 4);
    }

    /**
     * Expands the dirty element range for Buffer A
     * @param {number} start
     * @param {number} end
     * @private
     */
    _markDirtyA(start, end)
    {
        if (!this._dirtyA)
        {
            this._dirtyA = { start, end };
            return;
        }
        if (start < this._dirtyA.start) this._dirtyA.start = start;
        if (end > this._dirtyA.end) this._dirtyA.end = end;
    }

    /**
     * Expands the dirty element range for Buffer B
     * @param {number} start
     * @param {number} end
     * @private
     */
    _markDirtyB(start, end)
    {
        if (!this._dirtyB)
        {
            this._dirtyB = { start, end };
            return;
        }
        if (start < this._dirtyB.start) this._dirtyB.start = start;
        if (end > this._dirtyB.end) this._dirtyB.end = end;
    }

    /**
     * Gets the dirty element range for Buffer A since the last `ClearDirtyA`
     * @returns {{start:number, end:number}|null}
     */
    GetDirtyA()
    {
        return this._dirtyA ? { start: this._dirtyA.start, end: this._dirtyA.end } : null;
    }

    /**
     * Clears the dirty element range for Buffer A (call after uploading it)
     */
    ClearDirtyA()
    {
        this._dirtyA = null;
    }

    /**
     * Gets the dirty texture row range for Buffer A, for minimal texSubImage2D uploads
     * @returns {{y0:number, y1:number}|null}
     */
    GetDirtyARows()
    {
        if (!this._dirtyA) return null;
        const rowSize = this.textureWidth * 4;
        return {
            y0: Math.floor(this._dirtyA.start / rowSize),
            y1: Math.floor(this._dirtyA.end / rowSize)
        };
    }

    /**
     * Gets the dirty element range for Buffer B since the last `ClearDirtyB`
     * @returns {{start:number, end:number}|null}
     */
    GetDirtyB()
    {
        return this._dirtyB ? { start: this._dirtyB.start, end: this._dirtyB.end } : null;
    }

    /**
     * Clears the dirty element range for Buffer B (call after uploading it)
     */
    ClearDirtyB()
    {
        this._dirtyB = null;
    }

    /**
     * Gets the dirty texture row range for Buffer B, for minimal texSubImage2D uploads
     * @returns {{y0:number, y1:number}|null}
     */
    GetDirtyBRows()
    {
        if (!this._dirtyB) return null;
        const rowSize = this.textureWidth * 4;
        return {
            y0: Math.floor(this._dirtyB.start / rowSize),
            y1: Math.floor(this._dirtyB.end / rowSize)
        };
    }

}

/**
 * Packs a JavaScript number into IEEE-754 binary16 bits.
 * @param {number} value
 * @returns {number}
 */
function Float32ToFloat16Bits(value)
{
    if (!Number.isFinite(value)) return value < 0 ? 0xFC00 : 0x7C00;

    const sign = value < 0 ? 0x8000 : 0;
    const abs = Math.abs(value);
    if (abs === 0) return sign;
    if (abs >= 65504) return sign | 0x7BFF;

    if (abs < 0.00006103515625)
    {
        return sign | Math.min(0x03FF, Math.round(abs / 0.000000059604644775390625));
    }

    const exponent = Math.floor(Math.log2(abs));
    const mantissa = Math.round((abs / Math.pow(2, exponent) - 1) * 1024);
    if (mantissa === 1024)
    {
        return sign | ((exponent + 16) << 10);
    }
    return sign | ((exponent + 15) << 10) | (mantissa & 0x03FF);
}
/** Buffer B floats per light (position.xyz+radius, color.rgb+flags, params x4) */
CewgLightList.FLOATS_PER_LIGHT = 12;

/** Buffer A elements per tile header record */
CewgLightList.ELEMENTS_PER_HEADER = 3;

/** Buffer A elements per list node ([lightIndex, next]) */
CewgLightList.ELEMENTS_PER_NODE = 2;

/** Buffer B index reserved as the always-disabled null light */
CewgLightList.NULL_LIGHT_INDEX = 0;

/** Default maximum number of real lights (Buffer B indices 1..maxLights) */
CewgLightList.DEFAULT_MAX_LIGHTS = 254;

/** Default fixed texel width for both emulated RGBA32UI textures */
CewgLightList.DEFAULT_TEXTURE_WIDTH = 2048;

module.exports = { CewgLightList };
