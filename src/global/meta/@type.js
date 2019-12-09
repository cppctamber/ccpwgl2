import { Type } from "../engine/Tw2Constant";
import { decorate, typeHandler } from "./helpers";

/**
 * Creates a property type decorator
 * @param {String|Number} type
 * @returns {*}
 */
function createType(type)
{
    return decorate({
        property({ target, property, descriptor }, typeOf)
        {
            typeHandler({ target, property, descriptor }, type, typeOf);
        }
    });
}

export const listOf = createType(Type.LIST);
export const objectOf = createType(Type.OBJECT);
export const plainOf = createType(Type.PLAIN);

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
export const ushort = createType(Type.USHORT)();
export const byte = createType(Type.BYTE)();
export const raw = createType(Type.RAW)();
export const array = createType(Type.ARRAY)();
export const vector2 = createType(Type.VECTOR2)();
export const vector3 = createType(Type.VECTOR3)();
export const vector4 = createType(Type.VECTOR4)();
export const color = createType(Type.COLOR)();
export const quaternion = createType(Type.QUATERNION)();
export const matrix3 = createType(Type.MATRIX3)();
export const matrix4 = createType(Type.MATRIX4)();
export const indexBuffer = createType(Type.INDEX_BUFFER)();

export const enumerable = createType(Type.ENUM);
