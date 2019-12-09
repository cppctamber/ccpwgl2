import * as readers from "core/reader/Tw2BlackPropertyReaders";
import { Type } from "global/engine/Tw2Constant";
import { isArray, isFunction, isPlain, isString } from "../util/type";
import { decorate, typeHandler } from "./helpers";
import { set } from "./meta";

function blackHandler({ target, property, descriptor }, type, typeOf, reader)
{
    typeHandler({ target, property, descriptor }, type, typeOf);
    set("black", reader, target, property);
    set("black", true, target.constructor);
}

function createType(type, reader)
{
    return decorate({
        property({ target, property, descriptor }, typeOf)
        {
            blackHandler({ target, property, descriptor }, type, typeOf, reader);
        }
    });
}

export const listOf = createType(Type.LIST, readers.array);
export const objectOf = createType(Type.OBJECT, readers.object);
export const plainOf = createType(Type.PLAIN, readers.notImplemented);

export const list = createType(Type.LIST, readers.array)();
export const object = createType(Type.OBJECT, readers.object)();
export const plain = createType(Type.PLAIN, readers.notImplemented)();

export const unknown = createType(Type.UNKNOWN, readers.notImplemented)();
export const boolean = createType(Type.BOOLEAN, readers.boolean)();
export const string = createType(Type.STRING, readers.string)();
export const path = createType(Type.PATH, readers.path)();
export const expression = createType(Type.EXPRESSION, readers.string)();
export const float = createType(Type.FLOAT, readers.float)();
export const uint = createType(Type.UINT, readers.uint)();
export const byte = createType(Type.BYTE, readers.byte)();
export const ushort = createType(Type.USHORT, readers.ushort)();
export const raw = createType(Type.RAW, readers.rawObject)();
export const array = createType(Type.ARRAY, readers.array)();
export const vector2 = createType(Type.VECTOR2, readers.vector2)();
export const vector3 = createType(Type.VECTOR3, readers.vector3)();
export const vector4 = createType(Type.VECTOR4, readers.vector4)();
export const color = createType(Type.COLOR, readers.color)();
export const quaternion = createType(Type.QUATERNION, readers.vector4)();
export const matrix4 = createType(Type.MATRIX4, readers.matrix)();
export const indexBuffer = createType(Type.INDEX_BUFFER, readers.indexBuffer)();

export const fromList = decorate({
    property({ target, property, descriptor }, options, typeOf)
    {
        blackHandler({ target, property, descriptor }, Type.PLAIN, typeOf, readers.fromList(options));
    }
});

export const struct = decorate({

    property({ target, property, descriptor }, value, typeOf)
    {
        let reader = readers.notImplemented,
            type = Type.UNKNOWN;

        // list
        if (isArray(value))
        {
            if (isFunction(value[0]))
            {
                reader = readers.structList(value[0]);
                type = Type.LIST;
            }
        }
        // plain from list, using passed value as the source property key
        else if (isString(value))
        {
            reader = readers.fromList({ key: value });
            type = Type.PLAIN;
        }
        // plain from list
        else if (isPlain(value))
        {
            reader = readers.fromList(value);
            type = Type.PLAIN;
        }
        // object
        else if (isFunction(value))
        {
            reader = readers.struct(value);
            type = Type.OBJECT;
        }

        blackHandler({ target, property, descriptor }, type, typeOf, reader);
    }
});


