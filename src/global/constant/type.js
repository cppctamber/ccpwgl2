
// PT values have no actual meaning in and of themselves.
// They're unique short codes for property types, used to keep serialized data compact.

export const PT_UNKNOWN = 0;
export const PT_BOOLEAN = 1;
export const PT_ENUM = 2;

export const PT_STRING = 10;
export const PT_PATH = 11;
export const PT_EXPRESSION = 12;

export const PT_BYTE = 20;
export const PT_UINT = 21;
export const PT_USHORT = 22;
export const PT_FLOAT = 23;
export const PT_INT64 = 24;

export const PT_STRUCT = 30;
export const PT_STRUCT_RAW = 31;
export const PT_STRUCT_LIST = 32;

export const PT_PLAIN = 33;
export const PT_ARRAY = 34;

export const PT_VECTOR = 50;
export const PT_VECTOR2 = 51;
export const PT_VECTOR3 = 52;
export const PT_VECTOR4 = 53;
export const PT_COLOR = 60;
export const PT_QUATERNION = 61;
export const PT_MATRIX3 = 70;
export const PT_MATRIX4 = 71;

export const PT_TRANSLATION = 72;
export const PT_SCALING = 73;
export const PT_ROTATION = 74;

export const PT_UINT8_ARRAY = 81;
export const PT_UINT8_CLAMPED_ARRAY = 82;
export const PT_UINT16_ARRAY = 83;
export const PT_UINT32_ARRAY = 84;
export const PT_INT8_ARRAY = 85;
export const PT_INT16_ARRAY = 86;
export const PT_INT32_ARRAY = 87;
export const PT_FLOAT32_ARRAY = 88;
export const PT_FLOAT64_ARRAY = 89;

// Normalized aliases for property types.
export const PT_UINT8 = PT_BYTE;
export const PT_UINT32 = PT_UINT;
export const PT_UINT16 = PT_USHORT;
export const PT_FLOAT32 = PT_FLOAT;

export const PT_OBJECT = PT_STRUCT;
export const PT_RAW_OBJECT = PT_STRUCT_RAW;
export const PT_LIST = PT_STRUCT_LIST;
export const PT_JS_OBJECT = PT_PLAIN;
export const PT_JS_ARRAY = PT_ARRAY;

/**
 * Normalized property type names keyed by PT value.
 * These names are for schema/meta readability only; PT values remain the runtime contract.
 */
export const PT_NAME = Object.freeze({
    [PT_UNKNOWN]: "unknown",
    [PT_BOOLEAN]: "boolean",
    [PT_ENUM]: "enums",
    [PT_STRING]: "string",
    [PT_PATH]: "path",
    [PT_EXPRESSION]: "expression",
    [PT_BYTE]: "uint8",
    [PT_UINT]: "uint32",
    [PT_USHORT]: "uint16",
    [PT_FLOAT]: "float32",
    [PT_INT64]: "int64",
    [PT_STRUCT]: "object",
    [PT_STRUCT_RAW]: "rawObject",
    [PT_STRUCT_LIST]: "list",
    [PT_PLAIN]: "jsObject",
    [PT_ARRAY]: "jsArray",
    [PT_VECTOR]: "vector",
    [PT_VECTOR2]: "vector2",
    [PT_VECTOR3]: "vector3",
    [PT_VECTOR4]: "vector4",
    [PT_COLOR]: "color",
    [PT_QUATERNION]: "quaternion",
    [PT_MATRIX3]: "matrix3",
    [PT_MATRIX4]: "matrix4",
    [PT_TRANSLATION]: "translation",
    [PT_SCALING]: "scaling",
    [PT_ROTATION]: "rotation",
    [PT_UINT8_ARRAY]: "uint8Array",
    [PT_UINT8_CLAMPED_ARRAY]: "uint8ClampedArray",
    [PT_UINT16_ARRAY]: "uint16Array",
    [PT_UINT32_ARRAY]: "uint32Array",
    [PT_INT8_ARRAY]: "int8Array",
    [PT_INT16_ARRAY]: "int16Array",
    [PT_INT32_ARRAY]: "int32Array",
    [PT_FLOAT32_ARRAY]: "float32Array",
    [PT_FLOAT64_ARRAY]: "float64Array"
});

/**
 * Gets a normalized property type name from a PT value.
 * @param {Number} type
 * @returns {String|null}
 */
export function getPropertyTypeName(type)
{
    type = Number(type);
    return Object.prototype.hasOwnProperty.call(PT_NAME, type) ? PT_NAME[type] : null;
}

/**
 * Property type constants map.
 * @typedef {Object} PropertyTypeConstants
 */
export const PT = Object.freeze({
    UNKNOWN: PT_UNKNOWN,
    BOOLEAN: PT_BOOLEAN,
    ENUM: PT_ENUM,
    STRING: PT_STRING,
    PATH: PT_PATH,
    EXPRESSION: PT_EXPRESSION,
    BYTE: PT_BYTE,
    UINT8: PT_UINT8,
    UINT: PT_UINT,
    UINT32: PT_UINT32,
    USHORT: PT_USHORT,
    UINT16: PT_UINT16,
    FLOAT: PT_FLOAT,
    FLOAT32: PT_FLOAT32,
    INT64: PT_INT64,
    STRUCT: PT_STRUCT,
    OBJECT: PT_OBJECT,
    STRUCT_RAW: PT_STRUCT_RAW,
    RAW_OBJECT: PT_RAW_OBJECT,
    STRUCT_LIST: PT_STRUCT_LIST,
    LIST: PT_LIST,
    PLAIN: PT_PLAIN,
    JS_OBJECT: PT_JS_OBJECT,
    ARRAY: PT_ARRAY,
    JS_ARRAY: PT_JS_ARRAY,
    VECTOR: PT_VECTOR,
    VECTOR2: PT_VECTOR2,
    VECTOR3: PT_VECTOR3,
    VECTOR4: PT_VECTOR4,
    COLOR: PT_COLOR,
    QUATERNION: PT_QUATERNION,
    MATRIX3: PT_MATRIX3,
    MATRIX4: PT_MATRIX4,
    TRANSLATION: PT_TRANSLATION,
    SCALING: PT_SCALING,
    ROTATION: PT_ROTATION,
    UINT8_ARRAY: PT_UINT8_ARRAY,
    UINT8_CLAMPED_ARRAY: PT_UINT8_CLAMPED_ARRAY,
    UINT16_ARRAY: PT_UINT16_ARRAY,
    UINT32_ARRAY: PT_UINT32_ARRAY,
    INT8_ARRAY: PT_INT8_ARRAY,
    INT16_ARRAY: PT_INT16_ARRAY,
    INT32_ARRAY: PT_INT32_ARRAY,
    FLOAT32_ARRAY: PT_FLOAT32_ARRAY,
    FLOAT64_ARRAY: PT_FLOAT64_ARRAY
});
