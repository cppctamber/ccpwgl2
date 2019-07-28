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

    switch (ext)
    {
        case "dds":
        case "png":
            // TODO: Remove the need to do this in Tw2TextureRes
            // Will need to provide all quality versions of these files in the cdn even if they
            // don't exist as ccpwgl will have no idea if they exist or not, and so we'd get
            // errors when changing texture qualities in the ccpwgl_int.device
            path = path.replace("_lowdetail", "");       // Shouldn't exist
            path = path.replace("_mediumdetail", "");    // Shouldn't exist
            path = path.replace(ext, `0.${ext}`);
            break;

        case "gr2":
            // TODO: Add support for these files
            // Temporarily use ccpwgl resources (this won't always work but will do for now)
            path = path.replace(ext, "wbg").replace("cdn:", "res:");
            break;

        case "red":
            // TODO: Handle red files
            // There may still be legit .red files some of which we won't be able to read
            // (Some are in .black format so we'll just rename for now...)
            path = path.replace(ext, "black");
            break;

        case "sm_hi":
        case "sm_lo":
            path = path.replace(ext, "fx");
            break;

        case "sm_depth":
            // TODO: Add support for depth shaders
            path = "";
            break;
    }

    return path;
}

/**
 * Reads objects
 * @param {Tw2BlackBinaryReader} reader
 * @param {*} [options={}]
 * @returns {*|Object} out
 */
export function object(reader, options = {})
{
    let {id = undefined} = options;

    const
        context = reader.context,
        givenId = id !== undefined,
        debugEnabled = store.classes.constructor.DEBUG_ENABLED;

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

    const
        objectReader = reader.ReadBinaryReader(reader.ReadU32()),
        type = objectReader.ReadStringU16(),
        target = context.ConstructType(type);

    if (!givenId)
    {
        reader.references.set(id, target);
    }

    if (!store.blacks.Has(type))
    {
        throw new ErrBinaryObjectTypeNotFound({type});
    }

    let properties = store.blacks.Get(type);

    while (!objectReader.AtEnd())
    {
        let property = objectReader.ReadStringU16();
        if (properties.has(property))
        {
            try
            {
                const
                    reader = properties.get(property),
                    value = reader(objectReader, {target, property});

                // Handlers set their own values
                if (!reader.handler)
                {
                    if (!(property in target) && debugEnabled)
                    {
                        console.log(`'${type}' missing property: '${property}'`);
                    }

                    target[property] = value;
                }
            }
            catch (err)
            {
                if (debugEnabled) console.dir(target);
                throw new ErrBinaryReaderReadError(`${property} > ${err.message}`);
            }
        }
        else
        {
            if (debugEnabled) console.dir(target);
            throw new ErrBinaryReaderReadError({readError: `Unknown property "${property}" for "${type}"`});
        }
    }

    objectReader.ExpectEnd("object did not read to end");

    if ("Initialize" in target)
    {
        target.Initialize();
    }

    return target;
}

/**
 * Reads a plain object
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Object} out
 */
export function rawObject(reader)
{
    return object(reader, {id: null});
}

/**
 * Reads an array
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Array} out
 */
export function array(reader)
{
    const
        result = [],
        count = reader.ReadU32();

    for (let i = 0; i < count; i++)
    {
        result[i] = object(reader);
    }
    return result;
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
 * Reads enums
 * @param {Tw2BlackBinaryReader} reader
 * @returns {*}
 */
export function enums(reader)
{
    const
        value = reader.ReadStringU16(),
        entry = value.split(","),
        out = {};

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
 * @param {*} options
 * @returns {vec2}
 */
export function vector2(reader, options)
{
    const out = options.target[options.property];
    return vec2.set(out, reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a vector3
 * @param {Tw2BlackBinaryReader} reader
 * @param {*} options
 * @returns {vec3}
 */
export function vector3(reader, options)
{
    const out = options.target[options.property];
    return vec3.set(out, reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a color
 * @param {Tw2BlackBinaryReader} reader
 * @param {*} options
 * @returns {vec4} out
 */
export function color(reader, options)
{
    const out = options.target[options.property];
    return vec4.set(out, reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a vector4
 * @param {Tw2BlackBinaryReader} reader
 * @param {*} options
 * @returns {vec4} out
 */
export function vector4(reader, options)
{
    const out = options.target[options.property];
    return vec4.set(out, reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
}

/**
 * Reads a matrix with 16 elements
 * @param {Tw2BlackBinaryReader} reader
 * @param {*} options
 * @returns {mat4} out
 */
export function matrix(reader, options)
{
    const out = options.target[options.property];
    return mat4.set(out,
        reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32(),
        reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32(),
        reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32(),
        reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32()
    );
}

/**
 * Reads an index buffer
 * @param {Tw2BlackBinaryReader} reader
 * @returns {Uint32Array}
 */
export function indexBuffer(reader)
{
    const
        count = reader.ReadU32(),
        byteSize = reader.ReadU16();

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
 * @returns {Function}
 */
export function struct(struct)
{
    return function(reader)
    {
        return struct.blackStruct ? struct.blackStruct(reader) : struct(reader);
    };
}

/**
 * Reads a struct list
 * @param {*} struct
 * @returns {Function}
 */
export function structList(struct)
{
    return function(reader)
    {
        let
            count = reader.ReadU32(),
            byteSize = reader.ReadU16(),
            result = [];

        for (let i = 0; i < count; i++)
        {
            const structReader = reader.ReadBinaryReader(byteSize);
            result[i] = struct.blackStruct ? struct.blackStruct(structReader) : struct(structReader);
            structReader.ExpectEnd("struct read to end");
        }

        return result;
    };
}

/**
 * Gets a plain object from an array or struct list
 * @param {String} key
 * @param {String} [targetObjectProperty]
 * @param {Function} [struct]
 * @returns {fromArray}
 */
export function fromArray(key, targetObjectProperty, struct)
{
    function fromArray(reader, options)
    {
        const
            out = options.target[targetObjectProperty || options.property],
            arr = struct ? structList(struct)(reader) : array(reader);

        if (!key)
        {
            throw new Error("Invalid property");
        }

        if (!out)
        {
            throw new Error("Invalid target");
        }

        for (let i = 0; i < arr.length; i++)
        {
            const prop = arr[i][key];

            if (prop === undefined)
            {
                throw new Error("Invalid property key");
            }

            out[prop] = arr[i];
        }
    }

    fromArray.handler = true;

    return fromArray;
}
