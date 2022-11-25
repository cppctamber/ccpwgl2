import {
    GL_BYTE,
    GL_UNSIGNED_BYTE,
    GL_SHORT,
    GL_UNSIGNED_SHORT,
    GL_INT,
    GL_UNSIGNED_INT,
    GL_FLOAT
} from "constant";


function loop(n, f)
{
    const result = Array(n);
    for (let i = 0; i < n; ++i) result[i] = f(i);
    return result;
}

function nextPow16(v)
{
    for (let i = 16; i <= (1 << 28); i *= 16)
    {
        if (v <= i) return i;
    }
    return 0;
}

function log2(v)
{
    let r, shift;
    r = (v > 0xFFFF) << 4;
    v >>>= r;
    shift = (v > 0xFF) << 3;
    v >>>= shift;
    r |= shift;
    shift = (v > 0xF) << 2;
    v >>>= shift;
    r |= shift;
    shift = (v > 0x3) << 1;
    v >>>= shift;
    r |= shift;
    return r | (v >> 1);
}

export function createPool()
{

    const bufferPool = loop(8, function ()
    {
        return [];
    });

    function free(buf)
    {
        bufferPool[log2(buf.byteLength) >> 2].push(buf);
    }

    function alloc(n)
    {
        let sz = nextPow16(n),
            bin = bufferPool[log2(sz) >> 2];

        if (bin.length > 0) return bin.pop();

        return new ArrayBuffer(sz);
    }

    /**
     * Shortcut to allocating a float 32 array
     * @param {Number} length
     * @returns {Float32Array}
     */
    function allocF32(length)
    {
        const result = new Float32Array(alloc(4 * length), 0, length);
        return result.length !== length ? result.subarray(0, length) : result;
    }

    /**
     * Allocated a typed array of a given size
     * @param {Number|Function}type
     * @param {Number} n
     * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|null}
     */
    function allocType(type, n)
    {
        let result = null;
        switch (type)
        {
            case GL_BYTE:
            case Int8Array:
                result = new Int8Array(alloc(n), 0, n);
                break;

            case GL_UNSIGNED_BYTE:
            case Uint8Array:
                result = new Uint8Array(alloc(n), 0, n);
                break;

            case GL_SHORT:
            case Int16Array:
                result = new Int16Array(alloc(2 * n), 0, n);
                break;

            case GL_UNSIGNED_SHORT:
            case Uint16Array:
                result = new Uint16Array(alloc(2 * n), 0, n);
                break;

            case GL_INT:
            case Int32Array:
                result = new Int32Array(alloc(4 * n), 0, n);
                break;

            case GL_UNSIGNED_INT:
            case Uint32Array:
                result = new Uint32Array(alloc(4 * n), 0, n);
                break;

            case GL_FLOAT:
            case Float32Array:
                result = new Float32Array(alloc(4 * n), 0, n);
                break;

            default:
                return null;
        }

        if (result.length !== n)
        {
            return result.subarray(0, n);
        }

        return result;
    }

    function freeType(array)
    {
        free(array.buffer);
    }

    return {
        allocF32,
        allocType,
        unalloc: freeType,
        freeType,
        free
    };

}

export const pool = createPool();
