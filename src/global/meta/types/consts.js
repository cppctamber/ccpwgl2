/*

    Property Types

 */

export const Type = {
    UNKNOWN: 0,
    BOOLEAN: 1,
    STRING: 10,
    PATH: 11,
    EXPRESSION: 12,
    BYTE: 20,
    UINT: 21,
    USHORT: 22,
    FLOAT: 23,
    STRUCT: 30,
    STRUCT_RAW: 31,
    //STRUCT_PLAIN: 32,
    STRUCT_LIST: 33,
    PLAIN: 34,
    ARRAY: 35,
    VECTOR: 50,
    VECTOR2: 52,
    VECTOR3: 53,
    VECTOR4: 54,
    COLOR: 58,
    QUATERNION: 59,
    MATRIX3: 60,
    MATRIX4: 61,
    INDEX_BUFFER: 62,
    ENUM: 70,
};

export const TypeLength = {
    [Type.VECTOR2]: 2,
    [Type.VECTOR3]: 3,
    [Type.VECTOR4]: 4,
    [Type.COLOR]: 4,
    [Type.QUATERNION]: 4,
    [Type.MATRIX3]: 9,
    [Type.MATRIX4]: 16
};
