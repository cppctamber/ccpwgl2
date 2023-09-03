


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
export const PT_LOCAL_TRANSFORM = 75;
export const PT_ROTATION_TRANSFORM = 76;
export const PT_WORLD_TRANSFORM = 77;
export const PT_PARENT_WORLD_TRANSFORM = 78;
export const PT_PARENT_LOCAL_TRANSFORM = 79;

export const PT_UINT8_ARRAY = 81;
export const PT_UINT8_CLAMPED_ARRAY = 82;
export const PT_UINT16_ARRAY = 83;
export const PT_UINT32_ARRAY = 84;
export const PT_INT8_ARRAY = 85;
export const PT_INT16_ARRAY = 86;
export const PT_INT32_ARRAY = 87;
export const PT_FLOAT32_ARRAY = 88;
export const PT_FLOAT64_ARRAY = 89;

export const VectorConstructors = {
    [PT_VECTOR2]: Float32Array,
    [PT_VECTOR3]: Float32Array,
    [PT_VECTOR4]: Float32Array,
    [PT_QUATERNION]: Float32Array,
    [PT_COLOR]: Float32Array,
    [PT_MATRIX3]: Float32Array,
    [PT_MATRIX4]: Float32Array,
    [PT_FLOAT32_ARRAY] : Float32Array,
    [PT_FLOAT64_ARRAY] : Float64Array,
    [PT_UINT8_ARRAY] : Uint8Array,
    [PT_UINT8_CLAMPED_ARRAY] : Uint8ClampedArray,
    [PT_UINT16_ARRAY] : Uint16Array,
    [PT_UINT32_ARRAY] : Uint32Array,
    [PT_INT8_ARRAY] : Int8Array,
    [PT_INT16_ARRAY] : Int16Array,
    [PT_INT32_ARRAY] : Int32Array,
    [PT_ROTATION]: Float32Array,
    [PT_TRANSLATION]: Float32Array,
    [PT_SCALING]: Float32Array,
    [PT_ROTATION_TRANSFORM]: Float32Array,
    [PT_LOCAL_TRANSFORM]: Float32Array,
};

export const VectorLengths = {
    [PT_VECTOR2] : 2,
    [PT_VECTOR3] : 3,
    [PT_VECTOR4] : 4,
    [PT_QUATERNION] : 4,
    [PT_COLOR] : 4,
    [PT_MATRIX3] : 9,
    [PT_MATRIX4] : 16,
    [PT_ROTATION]: 4,
    [PT_TRANSLATION]: 3,
    [PT_SCALING]: 3,
    [PT_ROTATION_TRANSFORM]: 16,
    [PT_LOCAL_TRANSFORM]: 16,
};


