import {classes} from "./black";
import {ErrBinaryReaderReadError} from "../Tw2Error";

export function object(reader, id)
{
    let context = reader.context;

    if (arguments.length === 1)
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
    let result = context.ConstructType(type);

    if (arguments.length === 1)
    {
        reader.references.set(id, result);
    }

    if (!classes.has(type))
    {
        throw `unknown class ${type}`;
    }

    let properties = classes.get(type);

    // DEBUG
    let lastTen = [];

    while (!objectReader.AtEnd())
    {
        let propertyName = objectReader.ReadStringU16();

        if (properties.has(propertyName))
        {
            result[propertyName] = properties.get(propertyName)(objectReader);

            // DEBUG
            lastTen.unshift({[propertyName]: result[propertyName], _count: reader.offset});
            lastTen.splice(9);

        }
        else
        {
            // DEBUG
            console.debug(JSON.stringify(lastTen, null, 4));
            throw new ErrBinaryReaderReadError({ readerError: `Unknown property "${propertyName}" for "${type}"`});
        }
    }

    objectReader.ExpectEnd("object did not read to end?");
    return result;
}

export function array(reader)
{
    let count = reader.ReadU32();
    let result = [];

    for (let i = 0; i < count; i++)
    {
        result[i] = object(reader);
    }

    return result;
}

export function boolean(reader)
{
    return reader.ReadU8() !== 0;
}

export function color(reader)
{
    return [reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32()];
}

export function float(reader)
{
    return reader.ReadF32();
}

export function path(reader)
{
    return reader.ReadStringU16();
}

export function rawObject(reader)
{
    return object(reader, null);
}

export function string(reader)
{
    return reader.ReadStringU16();
}

export function ushort(reader)
{
    return reader.ReadU16();
}

export function uint(reader)
{
    return reader.ReadU32();
}

export function byte(reader)
{
    return reader.ReadU8();
}

export function vector2(reader, result = new Float32Array(2))
{
    result[0] = reader.ReadF32();
    result[1] = reader.ReadF32();
    return result;
}

export function vector3(reader, result = new Float32Array(3))
{
    result[0] = reader.ReadF32();
    result[1] = reader.ReadF32();
    result[2] = reader.ReadF32();
    return result;
}

export function vector4(reader, result = new Float32Array(4))
{
    result[0] = reader.ReadF32();
    result[1] = reader.ReadF32();
    result[2] = reader.ReadF32();
    result[3] = reader.ReadF32();
    return result;
}

export function matrix(reader)
{
    var buffer = new ArrayBuffer(64);

    return new Float32Array([
        ...vector4(reader, new Float32Array(buffer, 0, 4)),
        ...vector4(reader, new Float32Array(buffer, 16, 4)),
        ...vector4(reader, new Float32Array(buffer, 32, 4)),
        ...vector4(reader, new Float32Array(buffer, 48, 4))
    ]);
}

// Complicated
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

export function struct(struct)
{
    return function (reader)
    {
        return struct.ReadStruct(reader);
    };
}

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