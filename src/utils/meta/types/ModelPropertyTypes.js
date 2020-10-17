import { Type } from "./ModelConstants";
import { num, vec2, vec3, vec4, mat3, mat4 } from "math";
import {
    isArray,
    isBoolean,
    isEqual,
    isMatrix3,
    isMatrix4,
    isNumber,
    isPlain,
    isString,
    isVector,
    isVector2,
    isVector3, isVector4,
    isVectorEqual
} from "utils";

//  Helpers

const getArray = (a, key) => Array.from(a[key]);
const getPrimary = (a, key) => a[key];
const setPrimary = (a, key, value) => a[key] = value;
const equalsPrimary = (a, b) => a === b;
const returnFalse = () => false;
const notImplemented = () => { throw new ReferenceError("Not implemented"); };


// Boolean

export const boolean = {
    is: isBoolean,
    equals: equalsPrimary,
    get: getPrimary,
    set: setPrimary,
    type: Type.BOOLEAN
};


// Numbers

export const byte = {
    is: isNumber,
    equals: num.equals,
    get: getPrimary,
    set: setPrimary,
    type: Type.BYTE
};

export const float = Object.assign({}, byte, { type: Type.FLOAT });

export const uint = Object.assign({}, byte, { type: Type.UINT });

export const ushort = Object.assign({}, byte, { type: Type.USHORT });


//  Strings

export const string = {
    is: isString,
    equals: equalsPrimary,
    get: getPrimary,
    set: setPrimary,
    type: Type.STRING
};

export const expression = Object.assign({}, string, { type: Type.EXPRESSION });

export const path = Object.assign({}, string, { type: Type.PATH });


// Vectors

export const indexBuffer = {
    is: isVector,
    equals: isVectorEqual,
    get: getArray,
    set: (a, key, value) =>
    {
        if (a[key].length !== value.length)
        {
            a[key] = new Uint16Array(value);
        }
        else
        {
            a[key].set(value);
        }
    },
    type: Type.INDEX_BUFFER
};

export const vector = Object.assign({}, indexBuffer, { type: Type.VECTOR });

export const matrix3 = {
    is: isMatrix3,
    equals: mat3.equals,
    get: getArray,
    set: (a, key, value) => mat3.copy(a[key], value),
    type: Type.MATRIX3
};

export const matrix4 = {
    is: isMatrix4,
    equals: mat4.equals,
    get: getArray,
    set: (a, key, value) => mat4.copy(a[key], value),
    type: Type.MATRIX4
};

export const vector2 = {
    is: isVector2,
    equals: vec2.equals,
    get: getArray,
    set: (a, key, value) => vec2.copy(a[key], value),
    type: Type.VECTOR2
};

export const vector3 = {
    is: isVector3,
    equals: vec3.equals,
    get: getArray,
    set: (a, key, value) => vec3.copy(a[key], value),
    type: Type.VECTOR3
};

export const vector4 = {
    is: isVector4,
    equals: vec4.equals,
    get: getArray,
    set: (a, key, value) => vec4.copy(a[key], value),
    type: Type.VECTOR4
};

export const color = Object.assign({}, vector4, { type: Type.COLOR });

export const quaternion = Object.assign({}, vector4, { type: Type.QUATERNION });


// Objects

export const plain = {
    is: isPlain,
    equals: isEqual,
    get: (a, key) => Object.assign({}, a[key]),
    set: (a, key, value) => Object.assign(a[key], value),
    type: Type.PLAIN
};

export const struct = {
    is(value, dest)
    {
        if (!isPlain(value)) return false;
        // TODO:  Handle struct type checking...
        return true;
    },
    equals: returnFalse,
    get(a, key, options)
    {
        try
        {
            return a[key] === null ? null : a[key].GetValues({}, options);
        }
        catch (err)
        {
            console.dir(a[key]);
            throw err;
        }
    },
    set: notImplemented,
    type: Type.STRUCT
};

export const structRaw = Object.assign({}, struct, { type: Type.STRUCT_RAW });

export const structList = {
    is(value, dest)
    {
        if (!isArray(value)) return false;
        // TODO: Handle struct type checking...
        return true;
    },
    equals: returnFalse,
    get(a, key, options)
    {
        const len = a[key].length;
        if (!len) return null;
        let out = [];
        for (let i = 0; i < len; i++)
        {
            try
            {
                out.push(a[key][i].GetValues({}, options));
            }
            catch (err)
            {
                console.dir(a[key][i]);
                throw err;
            }
        }
        return out;
    },
    set: notImplemented,
    type: Type.STRUCT_LIST
};

