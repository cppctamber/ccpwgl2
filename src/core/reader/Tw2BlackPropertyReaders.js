import {vec2, vec3, vec4, mat4, store} from "../../global";
import {ErrBinaryObjectTypeNotFound, ErrBinaryReaderReadError} from "../Tw2Error";

/**
 * Internal handler for modifying ccp paths and strings
 * @param {String} path
 * @returns {String}
 */
function onString(path)
{
    // Because there are two sources for "res:" now we need to replace
    // any references from the eve cdn with a new res path mapping
    if (path.indexOf("res:") === 0)
    {
        path = "cdn:" + path.substring(4);
    }

    let ext = "";
    const dot = path.lastIndexOf(".");
    if (dot !== -1) ext = path.substr(dot + 1).toLowerCase();

    switch(ext)
    {
        case "dds":
        case "png":
            // Replace cdn resource qualities with ccpwgl quality suffixes
            // TODO: Remove the need to do this in Tw2TextureRes
            path = path.replace(`_lowdetail.${ext}`);       // Shouldn't exist
            path = path.replace(`_mediumdetail.${ext}`);    // Shouldn't exist
            path = path.replace(ext, `0.${ext}`);
            break;

        case "gr2":
        case "sm_hi":
        case "sm_lo":
        case "sm_depth":
            console.log(`Removing unsupported file format: ${path}`);
            path = "";
            break;

        case "red":
            // Dunno why ccp still calls them .red
            path = path.replace("red", "black");
            break;
    }

    return path;
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

    if (!store.blacks.Has(type))
    {
        throw new ErrBinaryObjectTypeNotFound({type});
    }

    let properties = store.blacks.Get(type);

    while (!objectReader.AtEnd())
    {
        let propertyName = objectReader.ReadStringU16();

        if (properties.has(propertyName))
        {
            // Debug
            if (!(propertyName in out))
            {
                console.log(`'${type}' missing property: '${propertyName}'`);
            }

            try
            {
                out[propertyName] = properties.get(propertyName)(objectReader, out[propertyName]);
            }
            catch (err)
            {
                throw new ErrBinaryReaderReadError(`${propertyName} > ` + err.message);
            }
        }
        else
        {
            throw new ErrBinaryReaderReadError({
                readerError: `Unknown property "${propertyName}" for "${type}"`
            });
        }
    }

    objectReader.ExpectEnd("object did not read to end");

    if ("Initialize" in out)
    {
        out.Initialize();
    }

    return out;
}

/**
 * Reads a plain object
 * @param {Tw2BlackBinaryReader} reader
 * @param {Object} [out={}]
 * @returns {Object} out
 */
export function plain(reader, out = {})
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

export function enums(reader)
{
    const value = reader.ReadStringU16();
    const entry = value.split(",");
    const out = {};
    for (let i = 0; i < entry.length; i++)
    {
        const split = entry[i].split("=");
        out[split[0]] = Number(split[1]);
    }
    return out;
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
        return struct.readStruct(reader);
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
            result[i] = struct.readStruct(structReader);
            structReader.ExpectEnd("struct read to end");
        }

        return result;
    };
}