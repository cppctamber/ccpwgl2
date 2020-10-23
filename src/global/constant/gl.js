/*

    Webgl & Webgl2

*/
export const GL_COLOR_BUFFER_BIT = 16384;
export const GL_DEPTH_BUFFER_BIT = 256;
export const GL_STENCIL_BUFFER_BIT = 1024;

export const GL_TEXTURE_2D = 3553;
export const GL_TEXTURE_CUBE_MAP = 34067;
export const GL_TEXTURE_3D = 32879;

export const GL_TEXTURE_MAG_FILTER = 10240;
export const GL_TEXTURE_MIN_FILTER = 10241;
export const GL_TEXTURE_WRAP_S = 10242;
export const GL_TEXTURE_WRAP_T = 10243;

export const GL_BYTE = 5120;
export const GL_UNSIGNED_BYTE = 5121;
export const GL_SHORT = 5122;
export const GL_UNSIGNED_SHORT = 5123;
export const GL_INT = 5124;
export const GL_UNSIGNED_INT = 5125;
export const GL_FLOAT = 5126;
export const GL_HALF_FLOAT_OES = 36193;                                     //webgl only
export const GL_HALF_FLOAT = 5131;                                          //webgl2
export const GL_DEPTH_COMPONENT16 = 33189;                                  //webgl2
export const GL_DEPTH_COMPONENT24 = 33190;                                  //webgl2
export const GL_DEPTH_COMPONENT32F = 36012;                                 //webgl2

export const GL_FLOAT_VEC2 = 35664;
export const GL_FLOAT_VEC3 = 35665;
export const GL_FLOAT_VEC4 = 35666;
export const GL_INT_VEC2 = 35667;
export const GL_INT_VEC3 = 35668;
export const GL_INT_VEC4 = 35669;
export const GL_BOOL = 35670;
export const GL_BOOL_VEC2 = 35671;
export const GL_BOOL_VEC3 = 35672;
export const GL_BOOL_VEC4 = 35673;
export const GL_FLOAT_MAT2 = 35674;
export const GL_FLOAT_MAT3 = 35675;
export const GL_FLOAT_MAT4 = 35676;

export const GL_TYPE_LENGTH = {
    [GL_FLOAT]: 1,
    [GL_INT]: 1,
    [GL_BYTE]: 1,
    [GL_BOOL]: 1,
    [GL_FLOAT_VEC2]: 2,
    [GL_INT_VEC2]: 2,
    [GL_BOOL_VEC2]: 2,
    [GL_FLOAT_VEC3]: 3,
    [GL_INT_VEC3]: 3,
    [GL_BOOL_VEC3]: 3,
    [GL_FLOAT_VEC4]: 4,
    [GL_INT_VEC4]: 4,
    [GL_BOOL_VEC4]: 4,
    [GL_FLOAT_MAT3]: 9,
    [GL_FLOAT_MAT4]: 16
};

export const GL_SAMPLER_2D = 35678;
export const GL_SAMPLER_3D = 35679;
export const GL_SAMPLER_CUBE = 35680;

export const GL_DEPTH_COMPONENT = 6402;
export const GL_ALPHA = 6406;
export const GL_RGB = 6407;
export const GL_RGBA = 6408;
export const GL_LUMINANCE = 6409;
export const GL_LUMINANCE_ALPHA = 6410;
export const GL_DEPTH_STENCIL = 34041;
export const GL_UNSIGNED_INT_24_8_WEBGL = 34042;

export const GL_R8 = 33321;                                                 //webgl2
export const GL_R16F = 33325;                                               //webgl2
export const GL_R32F = 33326;                                               //webgl2
export const GL_R8UI = 33330;                                               //webgl2
export const GL_RG8 = 33323;                                                //webgl2
export const GL_RG16F = 33327;                                              //webgl2
export const GL_RG32F = 33328;                                              //webgl2
export const GL_RGB8 = 32849;                                               //webgl2
export const GL_SRGB8 = 35905;                                              //webgl2
export const GL_RGB565 = 36194;                                             //webgl2
export const GL_R11F_G11F_B10F = 35898;                                     //webgl2
export const GL_RGB9_E5 = 35901;                                            //webgl2
export const GL_RGB16F = 34843;                                             //webgl2
export const GL_RGB32F = 34837;                                             //webgl2
export const GL_RGB8UI = 36221;                                             //webgl2
export const GL_RGBA8 = 32856;                                              //webgl2
export const GL_RGB5_A1 = 32855;                                            //webgl2
export const GL_RGBA16F = 34842;                                            //webgl2
export const GL_RGBA32F = 34836;                                            //webgl2
export const GL_RGBA8UI = 36220;                                            //webgl2
export const GL_RGBA16I = 36232;                                            //webgl2
export const GL_RGBA16UI = 36214;                                           //webgl2
export const GL_RGBA32I = 36226;                                            //webgl2
export const GL_RGBA32UI = 36208;                                           //webgl2

export const GL_NEAREST = 9728;
export const GL_LINEAR = 9729;
export const GL_NEAREST_MIPMAP_NEAREST = 9984;
export const GL_LINEAR_MIPMAP_NEAREST = 9985;
export const GL_NEAREST_MIPMAP_LINEAR = 9986;
export const GL_LINEAR_MIPMAP_LINEAR = 9987;

export const GL_REPEAT = 10497;
export const GL_CLAMP_TO_EDGE = 33071;
export const GL_MIRRORED_REPEAT = 33648;

export const GL_ZERO = 0;
export const GL_ONE = 1;
export const GL_SRC_COLOR = 768;
export const GL_ONE_MINUS_SRC_COLOR = 769;
export const GL_SRC_ALPHA = 770;
export const GL_ONE_MINUS_SRC_ALPHA = 771;
export const GL_DST_ALPHA = 772;
export const GL_ONE_MINUS_DST_ALPHA = 773;
export const GL_DST_COLOR = 774;
export const GL_ONE_MINUS_DST_COLOR = 775;
export const GL_SRC_ALPHA_SATURATE = 776;
export const GL_CONSTANT_COLOR = 32769;
export const GL_ONE_MINUS_CONSTANT_COLOR = 32770;
export const GL_CONSTANT_ALPHA = 32771;
export const GL_ONE_MINUS_CONSTANT_ALPHA = 32772;

export const GL_VERTEX_SHADER = 35633;
export const GL_FRAGMENT_SHADER = 35632;

export const GL_FRONT = 1028;
export const GL_BACK = 1029;
export const GL_FRONT_AND_BACK = 1032;

export const GL_NEVER = 512;
export const GL_LESS = 513;
export const GL_EQUAL = 514;
export const GL_LEQUAL = 515;
export const GL_GREATER = 516;
export const GL_NOTEQUAL = 517;
export const GL_GEQUAL = 518;
export const GL_ALWAYS = 519;

export const GL_KEEP = 7680;
export const GL_REPLACE = 7681;
export const GL_INCR = 7682;
export const GL_DECR = 7683;
export const GL_INCR_WRAP = 34055;
export const GL_DECR_WRAP = 34056;
export const GL_INVERT = 5386;

export const GL_STREAM_DRAW = 35040;
export const GL_STATIC_DRAW = 35044;
export const GL_DYNAMIC_DRAW = 35048;

export const GL_ARRAY_BUFFER = 34962;
export const GL_ELEMENT_ARRAY_BUFFER = 34963;

export const GL_POINTS = 0;
export const GL_LINES = 1;
export const GL_LINE_LOOP = 2;
export const GL_LINE_STRIP = 3;
export const GL_TRIANGLES = 4;
export const GL_TRIANGLE_STRIP = 5;
export const GL_TRIANGLE_FAN = 6;

export const GL_CW = 2304;
export const GL_CCW = 2305;

export const GL_CULL_FACE = 2884;
export const GL_DEPTH_TEST = 2929;
export const GL_BLEND = 3042;
