import * as readers from "core/reader/Tw2BlackPropertyReaders";
import { getReaderFromType } from "core/reader/Tw2BlackPropertyReaders";
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
            if (!reader) reader = getReaderFromType(type);
            blackHandler({ target, property, descriptor }, type, typeOf, reader);
        }
    });
}

export const listOf = createType(Type.LIST);
export const objectOf = createType(Type.OBJECT);
export const plainOf = createType(Type.PLAIN);
export const rawOf = createType(Type.RAW);

export const list = createType(Type.LIST)();
export const object = createType(Type.OBJECT)();
export const plain = createType(Type.PLAIN)();

export const unknown = createType(Type.UNKNOWN)();
export const boolean = createType(Type.BOOLEAN)();
export const string = createType(Type.STRING)();
export const path = createType(Type.PATH)();
export const expression = createType(Type.EXPRESSION)();
export const float = createType(Type.FLOAT)();
export const uint = createType(Type.UINT)();
export const byte = createType(Type.BYTE)();
export const ushort = createType(Type.USHORT)();
export const raw = createType(Type.RAW)();
export const array = createType(Type.ARRAY)();
export const vector2 = createType(Type.VECTOR2)();
export const vector3 = createType(Type.VECTOR3)();
export const vector4 = createType(Type.VECTOR4)();
export const color = createType(Type.COLOR)();
export const quaternion = createType(Type.QUATERNION)();
export const matrix4 = createType(Type.MATRIX4)();
export const indexBuffer = createType(Type.INDEX_BUFFER)();
export const enums = createType(Type.ENUM)();

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


