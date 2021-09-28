export const PT_UNKNOWN = 0;
export const PT_BOOLEAN = 1;
export const PT_STRING = 10;
export const PT_PATH = 11;
export const PT_EXPRESSION = 12;
export const PT_BYTE = 20;
export const PT_UINT = 21;
export const PT_USHORT = 22;
export const PT_FLOAT = 23;
export const PT_STRUCT = 30;
export const PT_STRUCT_RAW = 31;
//export const PT_STRUCT_PLAIN = 32;
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

export const PT_ENUM = 80;

export const PT_UINT8_ARRAY = 81;
export const PT_UINT8_CLAMPED_ARRAY = 82;
export const PT_UINT16_ARRAY = 83;
export const PT_UINT32_ARRAY = 84;
export const PT_INT8_ARRAY = 85;
export const PT_INT16_ARRAY = 86;
export const PT_INT32_ARRAY = 87;
export const PT_FLOAT32_ARRAY = 88;
export const PT_FLOAT64_ARRAY = 89;





export const VectorLengths = {
    [PT_VECTOR2] : 2,
    [PT_VECTOR3] : 3,
    [PT_VECTOR4] : 4,
    [PT_QUATERNION] : 4,
    [PT_COLOR] : 4,
    [PT_MATRIX3] : 9,
    [PT_MATRIX4] : 16,
};


