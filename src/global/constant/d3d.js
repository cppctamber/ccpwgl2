import {
    GL_CLAMP_TO_EDGE,
    GL_CONSTANT_COLOR,
    GL_DST_ALPHA,
    GL_DST_COLOR,
    GL_LINEAR,
    GL_LINEAR_MIPMAP_LINEAR,
    GL_LINEAR_MIPMAP_NEAREST,
    GL_MIRRORED_REPEAT,
    GL_NEAREST,
    GL_NEAREST_MIPMAP_LINEAR,
    GL_NEAREST_MIPMAP_NEAREST,
    GL_ONE,
    GL_ONE_MINUS_CONSTANT_COLOR,
    GL_ONE_MINUS_DST_ALPHA,
    GL_ONE_MINUS_DST_COLOR,
    GL_ONE_MINUS_SRC_ALPHA,
    GL_ONE_MINUS_SRC_COLOR,
    GL_REPEAT,
    GL_SRC_ALPHA,
    GL_SRC_ALPHA_SATURATE,
    GL_SRC_COLOR, GL_TEXTURE_2D, GL_TEXTURE_CUBE_MAP,
    GL_ZERO
} from "./gl";


// Render Mode
export const RM_ANY = -1;
export const RM_OPAQUE = 0;
export const RM_DECAL = 1;
export const RM_TRANSPARENT = 2;
export const RM_ADDITIVE = 3;
export const RM_DEPTH = 4;
export const RM_FULLSCREEN = 5;
export const RM_PICKABLE = 6;
export const RM_DISTORTION = 7;

// Render States
export const RS_ZENABLE = 7;                                            // D3DZBUFFERTYPE (or TRUE/FALSE for legacy)
export const RS_FILLMODE = 8;                                           // D3DFILLMODE
export const RS_SHADEMODE = 9;                                          // D3DSHADEMODE
export const RS_ZWRITEENABLE = 14;                                      // TRUE to enable z writes
export const RS_ALPHATESTENABLE = 15;                                   // TRUE to enable alpha tests
export const RS_LASTPIXEL = 16;                                         // TRUE for last-pixel on lines
export const RS_SRCBLEND = 19;                                          // D3DBLEND
export const RS_DESTBLEND = 20;                                         // D3DBLEND
export const RS_CULLMODE = 22;                                          // D3DCULL
export const RS_ZFUNC = 23;                                             // D3DCMPFUNC
export const RS_ALPHAREF = 24;                                          // D3DFIXED
export const RS_ALPHAFUNC = 25;                                         // D3DCMPFUNC
export const RS_DITHERENABLE = 26;                                      // TRUE to enable dithering
export const RS_ALPHABLENDENABLE = 27;                                  // TRUE to enable alpha blending
export const RS_FOGENABLE = 28;                                         // TRUE to enable fog blending
export const RS_SPECULARENABLE = 29;                                    // TRUE to enable specular
export const RS_FOGCOLOR = 34;                                          // D3DCOLOR
export const RS_FOGTABLEMODE = 35;                                      // D3DFOGMODE
export const RS_FOGSTART = 36;                                          // Fog start (for both vertex and pixel fog)
export const RS_FOGEND = 37;                                            // Fog end
export const RS_FOGDENSITY = 38;                                        // Fog density
export const RS_RANGEFOGENABLE = 48;                                    // Enables range-based fog
export const RS_STENCILENABLE = 52;                                     // BOOL enable/disable stenciling
export const RS_STENCILFAIL = 53;                                       // D3DSTENCILOP to do if stencil test fails
export const RS_STENCILZFAIL = 54;                                      // D3DSTENCILOP to do if stencil test passes and Z test fails
export const RS_STENCILPASS = 55;                                       // D3DSTENCILOP to do if both stencil and Z tests pass
export const RS_STENCILFUNC = 56;                                       // D3DCMPFUNC fn.  Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
export const RS_STENCILREF = 57;                                        // Reference value used in stencil test
export const RS_STENCILMASK = 58;                                       // Mask value used in stencil test
export const RS_STENCILWRITEMASK = 59;                                  // Write mask applied to values written to stencil buffer
export const RS_TEXTUREFACTOR = 60;                                     // D3DCOLOR used for multi-texture blend
export const RS_WRAP0 = 128;                                            // wrap for 1st texture coord. set
export const RS_WRAP1 = 129;                                            // wrap for 2nd texture coord. set
export const RS_WRAP2 = 130;                                            // wrap for 3rd texture coord. set
export const RS_WRAP3 = 131;                                            // wrap for 4th texture coord. set
export const RS_WRAP4 = 132;                                            // wrap for 5th texture coord. set
export const RS_WRAP5 = 133;                                            // wrap for 6th texture coord. set
export const RS_WRAP6 = 134;                                            // wrap for 7th texture coord. set
export const RS_WRAP7 = 135;                                            // wrap for 8th texture coord. set
export const RS_CLIPPING = 136;
export const RS_LIGHTING = 137;
export const RS_AMBIENT = 139;
export const RS_FOGVERTEXMODE = 140;
export const RS_COLORVERTEX = 141;
export const RS_LOCALVIEWER = 142;
export const RS_NORMALIZENORMALS = 143;
export const RS_DIFFUSEMATERIALSOURCE = 145;
export const RS_SPECULARMATERIALSOURCE = 146;
export const RS_AMBIENTMATERIALSOURCE = 147;
export const RS_EMISSIVEMATERIALSOURCE = 148;
export const RS_VERTEXBLEND = 151;
export const RS_CLIPPLANEENABLE = 152;
export const RS_POINTSIZE = 154;                                        // float point size
export const RS_POINTSIZE_MIN = 155;                                    // float point size min threshold
export const RS_POINTSPRITEENABLE = 156;                                // BOOL point texture coord control
export const RS_POINTSCALEENABLE = 157;                                 // BOOL point size scale enable
export const RS_POINTSCALE_A = 158;                                     // float point attenuation A value
export const RS_POINTSCALE_B = 159;                                     // float point attenuation B value
export const RS_POINTSCALE_C = 160;                                     // float point attenuation C value
export const RS_MULTISAMPLEANTIALIAS = 161;                             // BOOL - set to do FSAA with multisample buffer
export const RS_MULTISAMPLEMASK = 162;                                  // DWORD - per-sample enable/disable
export const RS_PATCHEDGESTYLE = 163;                                   // Sets whether patch edges will use float style tessellation
export const RS_DEBUGMONITORTOKEN = 165;                                // DEBUG ONLY - token to debug monitor
export const RS_POINTSIZE_MAX = 166;                                    // float point size max threshold
export const RS_INDEXEDVERTEXBLENDENABLE = 167;
export const RS_COLORWRITEENABLE = 168;                                 // per-channel write enable
export const RS_TWEENFACTOR = 170;                                      // float tween factor
export const RS_BLENDOP = 171;                                          // D3DBLENDOP setting
export const RS_POSITIONDEGREE = 172;                                   // NPatch position interpolation degree. D3DDEGREE_LINEAR or D3DDEGREE_CUBIC (default)
export const RS_NORMALDEGREE = 173;                                     // NPatch normal interpolation degree. D3DDEGREE_LINEAR (default) or D3DDEGREE_QUADRATIC
export const RS_SCISSORTESTENABLE = 174;
export const RS_SLOPESCALEDEPTHBIAS = 175;
export const RS_ANTIALIASEDLINEENABLE = 176;
export const RS_TWOSIDEDSTENCILMODE = 185;                              // BOOL enable/disable 2 sided stenciling
export const RS_CCW_STENCILFAIL = 186;                                  // D3DSTENCILOP to do if ccw stencil test fails
export const RS_CCW_STENCILZFAIL = 187;                                 // D3DSTENCILOP to do if ccw stencil test passes and Z test fails
export const RS_CCW_STENCILPASS = 188;                                  // D3DSTENCILOP to do if both ccw stencil and Z tests pass
export const RS_CCW_STENCILFUNC = 189;                                  // D3DCMPFUNC fn.  ccw Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
export const RS_COLORWRITEENABLE1 = 190;                                // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
export const RS_COLORWRITEENABLE2 = 191;                                // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
export const RS_COLORWRITEENABLE3 = 192;                                // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
export const RS_BLENDFACTOR = 193;                                      // D3DCOLOR used for a constant blend factor during alpha blending for devices that support D3DPBLENDCAPS_BLENDFACTOR
export const RS_SRGBWRITEENABLE = 194;                                  // Enable rendertarget writes to be DE-linearized to SRGB (for formats that expose D3DUSAGE_QUERY_SRGBWRITE)
export const RS_DEPTHBIAS = 195;
export const RS_SEPARATEALPHABLENDENABLE = 206;                         // TRUE to enable a separate blending function for the alpha channel
export const RS_SRCBLENDALPHA = 207;                                    // SRC blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
export const RS_DESTBLENDALPHA = 208;                                   // DST blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
export const RS_BLENDOPALPHA = 209;                                     // Blending operation for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */// Cull Modes

// Cull
export const CULL_NONE = 1;
export const CULL_CW = 2;
export const CULL_CCW = 3;

// Compare
export const CMP_NEVER = 1;
export const CMP_LESS = 2;
export const CMP_EQUAL = 3;
export const CMP_LEQUAL = 4;
export const CMP_GREATER = 5;
export const CMP_NOTEQUAL = 6;
export const CMP_GREATEREQUAL = 7;
export const CMP_ALWAYS = 8;

// Blend
export const BLEND_ZERO = 1;
export const BLEND_ONE = 2;
export const BLEND_SRCCOLOR = 3;
export const BLEND_INVSRCCOLOR = 4;
export const BLEND_SRCALPHA = 5;
export const BLEND_INVSRCALPHA = 6;
export const BLEND_DESTALPHA = 7;
export const BLEND_INVDESTALPHA = 8;
export const BLEND_DESTCOLOR = 9;
export const BLEND_INVDESTCOLOR = 10;
export const BLEND_SRCALPHASAT = 11;
export const BLEND_BOTHSRCALPHA = 12;
export const BLEND_BOTHINVSRCALPHA = 13;
export const BLEND_BLENDFACTOR = 14;
export const BLEND_INVBLENDFACTOR = 15;

// Blend Operations
export const BLENDOP_ADD = 1;
export const BLENDOP_SUBTRACT = 2;
export const BLENDOP_REVSUBTRACT = 3;
export const BLENDOP_MIN = 4;
export const BLENDOP_MAX = 5;

// Blend Table
export const BlendTable = [
    -1,                                                                 // --
    GL_ZERO,                                                            // D3DBLEND_ZERO
    GL_ONE,                                                             // D3DBLEND_ONE
    GL_SRC_COLOR,                                                       // D3DBLEND_SRCCOLOR
    GL_ONE_MINUS_SRC_COLOR,                                             // D3DBLEND_INVSRCCOLOR
    GL_SRC_ALPHA,                                                       // D3DBLEND_SRCALPHA
    GL_ONE_MINUS_SRC_ALPHA,                                             // D3DBLEND_INVSRCALPHA
    GL_DST_ALPHA,                                                       // D3DBLEND_DESTALPHA
    GL_ONE_MINUS_DST_ALPHA,                                             // D3DBLEND_INVDESTALPHA
    GL_DST_COLOR,                                                       // D3DBLEND_DESTCOLOR
    GL_ONE_MINUS_DST_COLOR,                                             // D3DBLEND_INVDESTCOLOR
    GL_SRC_ALPHA_SATURATE,                                              // D3DBLEND_SRCALPHASAT
    -1,                                                                 // D3DBLEND_BOTHSRCALPHA
    -1,                                                                 // D3DBLEND_BOTHINVSRCALPHA
    GL_CONSTANT_COLOR,                                                  // D3DBLEND_BLENDFACTOR
    GL_ONE_MINUS_CONSTANT_COLOR                                         // D3DBLEND_INVBLENDFACTOR
];


export const WrapMode = {
    //DEFAULT: -1,
    REPEAT: 1,
    MIRRORED_REPEAT: 2,
    CLAMP_TO_EDGE: 3,
    CLAMP_TO_BORDER: 4  // Not supported by webgl
};

export const FilterMode = {
    //DEFAULT: -1,
    NEAREST: 1,
    LINEAR: 2,
    LINEAR_ANISOTROPY: 3 // Huh
};

export const MipFilterMode = {
    //DEFAULT: -1,
    NONE: 0,
    NEAREST: 1,
    LINEAR: 2,
    LINEAR_ANISOTROPY: 3 // Huh
};


export const TEX_2D = 2;
export const TEX_VOLUME =  3;  // 2D ARRAY
export const TEX_CUBE_MAP = 4;
export const TEX_SHADOW_MAP = 5;  // is this right?

export const TexTypeToGLTexture  = {
    [TEX_2D] : GL_TEXTURE_2D,
    [TEX_VOLUME] : GL_TEXTURE_2D,
    [TEX_CUBE_MAP] : GL_TEXTURE_CUBE_MAP,
    [TEX_SHADOW_MAP] : GL_TEXTURE_2D
};

// for debugging
export const TexTypeToString = {
    [TEX_2D] : "2D",
    [TEX_VOLUME] : "VOLUME",
    [TEX_CUBE_MAP] : "CUBE_MAP",
    [TEX_SHADOW_MAP] : "SHADOW_MAP"
};

