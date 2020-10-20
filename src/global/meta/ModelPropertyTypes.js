import { num, vec2, vec3, vec4, mat3, mat4 } from "math";
import * as Type from "constant/type";
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
} from "../utils/type";


export const propTypes = new Map();

//  Helpers

const getArray = (a, key) => Array.from(a[key]);
const getPrimary = (a, key) => a[key];
const setPrimary = (a, key, value) => a[key] = value;
const equalsPrimary = (a, b) => a === b;
const returnFalse = () => false;
const notImplemented = () => { throw new ReferenceError("Not implemented"); };


// Boolean

propTypes.set(Type.PT_BOOLEAN, {
    is: isBoolean,
    equals: equalsPrimary,
    get: getPrimary,
    set: setPrimary,
    type: Type.PT_BOOLEAN
});


// Numbers

function setNumber(type)
{
    propTypes.set(type, {
        is: isNumber,
        equals: num.equals,
        get: getPrimary,
        set: setPrimary,
        type
    });
}

setNumber(Type.PT_BYTE);
setNumber(Type.PT_FLOAT);
setNumber(Type.PT_UINT);
setNumber(Type.PT_USHORT);

//  Strings

function setString(type)
{
    propTypes.set(type, {
        is: isString,
        equals: equalsPrimary,
        get: getPrimary,
        set: setPrimary,
        type
    });
}

setString(Type.PT_STRING);
setString(Type.PT_EXPRESSION);
setString(Type.PT_PATH);


// Vectors

function setVector(type, Constructor)
{
    propTypes.set(type, {
        is: isVector,
        equals: isVectorEqual,
        get: getArray,
        set: (a, key, value) =>
        {
            if (a[key].length !== value.length)
            {
                if (Constructor)
                {
                    a[key] = new Constructor(value);
                }
                else
                {
                    a[key] = new a[key].constructor(value);
                }
            }
            else
            {
                a[key].set(value);
            }
        },
        type: Type.PT_INDEX_BUFFER
    });
}

setVector(Type.PT_INDEX_BUFFER, Uint16Array);
setVector(Type.PT_VECTOR, Float32Array);

propTypes.set(Type.PT_MATRIX3, {
    is: isMatrix3,
    equals: mat3.equals,
    get: getArray,
    set: (a, key, value) => mat3.copy(a[key], value),
    type: Type.PT_MATRIX3
});

propTypes.set(Type.PT_MATRIX4, {
    is: isMatrix4,
    equals: mat4.equals,
    get: getArray,
    set: (a, key, value) => mat4.copy(a[key], value),
    type: Type.PT_MATRIX4
});

propTypes.set(Type.PT_VECTOR2, {
    is: isVector2,
    equals: vec2.equals,
    get: getArray,
    set: (a, key, value) => vec2.copy(a[key], value),
    type: Type.PT_VECTOR2
});

propTypes.set(Type.PT_VECTOR3, {
    is: isVector3,
    equals: vec3.equals,
    get: getArray,
    set: (a, key, value) => vec3.copy(a[key], value),
    type: Type.PT_VECTOR3
});

function setVector4(type)
{
    propTypes.set(type, {
        is: isVector4,
        equals: vec4.equals,
        get: getArray,
        set: (a, key, value) => vec4.copy(a[key], value),
        type
    });
}

setVector4(Type.PT_VECTOR4);
setVector4(Type.PT_COLOR);
setVector4(Type.PT_QUATERNION);


// Objects

propTypes.set(Type.PT_PLAIN, {
    is: isPlain,
    equals: isEqual,
    get: (a, key) => Object.assign({}, a[key]),
    set: (a, key, value) => Object.assign(a[key], value),
    type: Type.PT_PLAIN
});

function setStruct(type)
{
    propTypes.set(type, {
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
        type
    });
}

setStruct(Type.PT_STRUCT);
setStruct(Type.PT_STRUCT_RAW);


propTypes.set(Type.PT_STRUCT_LIST, {
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
    type: Type.PT_STRUCT_LIST
});


