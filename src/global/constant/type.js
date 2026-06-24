
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
    UINT: PT_UINT,
    USHORT: PT_USHORT,
    FLOAT: PT_FLOAT,
    STRUCT: PT_STRUCT,
    STRUCT_RAW: PT_STRUCT_RAW,
    STRUCT_LIST: PT_STRUCT_LIST,
    PLAIN: PT_PLAIN,
    ARRAY: PT_ARRAY,
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
