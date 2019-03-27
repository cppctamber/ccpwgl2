import {vec2, vec3, vec4, mat4} from "../../global";
import {classes} from "./black";
import {ErrBinaryObjectTypeNotFound, ErrBinaryReaderReadError} from "../Tw2Error";

/**
 * Internal handler for "res" paths
 * @param {String} str
 * @returns {String}
 */
function onString(str)
{
    if (str.indexOf("res:") === 0)
    {
        str = "cdn:" + str.substring(4);
    }
    return str;
}

/**
 * Reads objects
 * @param {Tw2BlackBinaryReader} reader
 * @param {undefined|Object} [out]
 * @param {undefined|Number} [id]
 * @returns {*|Object} out
 */
export function object(reader, out, id)
{
    let context = reader.context;
    const givenId = id !== undefined;

    if (!givenId)
    {
        id = reader.ReadU32();

        if (id === 0)
        {
            return null;
        }
        else if (reader.references.has(id))
        {
            return reader.references.get(id);
        }
    }

    let objectReader = reader.ReadBinaryReader(reader.ReadU32());
    let type = objectReader.ReadStringU16();

    if (!out)
    {
        out = context.ConstructType(type);
    }

    if (!givenId)
    {
        reader.references.set(id, out);
    }

    if (!classes.has(type))
    {
        throw new ErrBinaryObjectTypeNotFound({ type });
    }

    let properties = classes.get(type);

    while (!objectReader.AtEnd())
    {
        let propertyName = objectReader.ReadStringU16();

        if (properties.has(propertyName))
        {
            // Debug
            if (!(propertyName in out))
            {
                console.log(`${type} missing property ${propertyName}`);
            }

            out[propertyName] = properties.get(propertyName)(objectReader, out[propertyName]);
        }
        else
        {
            throw new ErrBinaryReaderReadError({
                readerError: `Unknown property "${propertyName}" for "${type}"`
            });
        }
    }

    objectReader.ExpectEnd("object did not read to end");
    return out;
}

/**
 * Reads a plain object
 * @param {Tw2BlackBinaryReader} reader
 * @param {Object} [out={}]
 * @returns {Object} out
 */
export function plain(reader, out={})
{
    return object(reader, out, null);
}

/**
 * Reads an array
 * @param {Tw2BlackBinaryReader} reader
 * @param {Array} [out=[]]
 * @returns {Array} out
 */
export function array(reader, out = [])
{
    const count = reader.ReadU32();
    for (let i = 0; i < count; i++)
    {
        out[i] = object(reader);
    }
    return out;
}

/**
 * Reads a boolean
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Boolean}
 */
export function boolean(reader)
{
    return reader.ReadU8() !== 0;
}

/**
 * Reads a string
 * @param {Tw2BlackBinaryReader} reader
 * @returns {*}
 */
export function string(reader)
{
    return onString(reader.ReadStringU16());
}

/**
 * Reads a path
 * @param {Tw2BlackBinaryReader} reader
 * @returns {String}
 */
export function path(reader)
{
    return onString(reader.ReadStringU16());
}


/**
 * Reads a float
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Number}
 */
export function float(reader)
{
    return reader.ReadF32();
}

/**
 * Reads a ushort
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Number}
 */
export function ushort(reader)
{
    return reader.ReadU16();
}

/**
 * Reads a uint
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Number}
 */
export function uint(reader)
{
    return reader.ReadU32();
}

/**
 * Reads a byte
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Number}
 */
export function byte(reader)
{
    return reader.ReadU8();
}

/**
 * Reads a vector2
 * @param {Tw2BlackBinaryReader} reader
 * @param {vec2|TypedArray} [out]
 * @returns {vec2}
 */
export function vector2(reader, out = vec2.create())
{
    return vec2.set(out, reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a vector3
 * @param {Tw2BlackBinaryReader} reader
 * @param {vec3|TypedArray} [out]
 * @returns {Float32Array} out
 */
export function vector3(reader, out = vec3.create())
{
    return vec3.set(out, reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a color
 * @param {Tw2BlackBinaryReader} reader
 * @param {vec4|TypedArray} [out]
 * @returns {vec4} out
 */
export function color(reader, out = vec4.create())
{
    return vec4.set(out, reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a vector4
 * @param {Tw2BlackBinaryReader} reader
 * @param {vec4|TypedArray} [out]
 * @returns {vec4} out
 */
export function vector4(reader, out = vec4.create())
{
    return vec4.set(out, reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a matrix with 16 elements
 * @param {Tw2BlackBinaryReader} reader
 * @param {mat4|TypedArray} [out]
 * @returns {mat4} out
 */
export function matrix(reader, out = mat4.create())
{
    const buffer = new ArrayBuffer(64);
    return mat4.set(out,
        ...vector4(reader, new Float32Array(buffer, 0, 4)),
        ...vector4(reader, new Float32Array(buffer, 16, 4)),
        ...vector4(reader, new Float32Array(buffer, 32, 4)),
        ...vector4(reader, new Float32Array(buffer, 48, 4))
    );
}

/**
 * Reads an index buffer
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Uint32Array}
 */
export function indexBuffer(reader)
{
    let count = reader.ReadU32();
    let byteSize = reader.ReadU16();

    if (byteSize === 4)
    {
        return reader.ReadU32Array(count);
    }
    else
    {
        throw "unsupported for now";
    }
}

/**
 * Reads a struct
 * @param {*} struct
 * @returns {function(*=): *}
 */
export function struct(struct)
{
    return function (reader)
    {
        return struct.ReadStruct(reader);
    };
}

/**
 * Reads a struct list
 * @param {*} struct
 * @returns {function(*): Array}
 */
export function structList(struct)
{
    return function (reader)
    {
        let count = reader.ReadU32();
        let byteSize = reader.ReadU16();
        let result = [];

        for (let i = 0; i < count; i++)
        {
            let structReader = reader.ReadBinaryReader(byteSize);
            result[i] = struct.ReadStruct(structReader);
            structReader.ExpectEnd("struct read to end");
        }

        return result;
    };
}