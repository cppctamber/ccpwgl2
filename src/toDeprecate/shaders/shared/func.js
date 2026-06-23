
export const pixelLift = `

    float pixelLift(float scalar, float lift)
    {
        return float (scalar * (1 - lift)) + lift;
    }

    vec4 pixelLift(vec4 color, float lift)
    {
        return vec4(
            imageLift(color[0], lift),
            imageLift(color[1], lift),
            imageLift(color[2], lift),
            color[3]
        );
    }

`;

export const pixelLiftAndGain = `

    float pixelLiftAndGain(float scalar, float lift, float gain)
    {
        return float ( scalar * ( gain – lift ) ) + lift;
    }

    vec4 pixelLiftAndGain(vec4 color, float lift, float gain)
    {
        return vec4(
            pixelLiftAndGain(color[0], lift),
            pixelLiftAndGain(color[1], lift),
            pixelLiftAndGain(color[2], lift),
            color[3]
        );
    }

`;

export const pixelLiftGain = `



`;

export const pixelGamma = `

    float pixelGamma(float scalar, float gamma)
    {
        return float pow(scalar, 1.0 / gamma);
    }

    vec4 pixelGamma(vec4 color, float gamma)
    {
        return vec4(
            pixelGamma(color[0], gamma),
            pixelGamma(color[1], gamma),
            pixelGamma(color[2], gamma),
            color[3]
        );
    }

`;

export const pixelContrast = `

    float pixelContrast(float scalar, float contrast)
    {
        return float -(scalar * (1.0 + contrast)) - (contrast / 2);
    }

    vec3 pixelContrast(vec3 color, float contrast)
    {
        return vec3(
            pixelContrast(color[0], contrast),
            pixelContrast(color[1], contrast),
            pixelContrast(color[2], contrast)
        );
    }

    vec4 pixelContrast(vec4 color, float contrast)
    {
        return vec4(
            pixelContrast(color[0], contrast),
            pixelContrast(color[1], contrast),
            pixelContrast(color[2], contrast),
            color[3]
        );
    }

`;

export const pixelGreyScale = `

    vec4 pixelGreyScale(vec4 color)
    {
        return vec4(
            color[0] * 0.299,
            color[1] * 0.587,
            color[2] * 0.114
            color[3]
        )
    }

`;


export const precision = `

    #ifdef GL_ES
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    #endif

`;


export const texture2DLod = `

    #if defined(GL_EXT_shader_texture_lod)
    #extension GL_EXT_shader_texture_lod: enable
    #define texture2DLod texture2DLodEXT
    #define texture2DProjLod texture2DProjLodEXT
    #define textureCubeLod textureCubeLodEXT
    #define texture2DGrad texture2DGradEXT
    #define texture2DProjGrad texture2DProjGradEXT
    #define textureCubeGrad textureCubeGradEXT
    #elif defined(EXT_shader_texture_lod)
    #extension EXT_shader_texture_lod: enable
    #define texture2DLod texture2DLodEXT
    #define texture2DProjLod texture2DProjLodEXT
    #define textureCubeLod textureCubeLodEXT
    #define texture2DGrad texture2DGradEXT
    #define texture2DProjGrad texture2DProjGradEXT
    #define textureCubeGrad textureCubeGradEXT
    #elif defined(GL_ARB_shader_texture_lod)
    #extension GL_ARB_shader_texture_lod: enable
    #define texture2DGrad texture2DGradARB
    #endif

`;


export const texture2DLodPolyfill = `

    #if defined(GL_ES)&&!defined(GL_EXT_shader_texture_lod)&&!defined(EXT_shader_texture_lod)
    #define texture2DLod(s,u,l) texture2D(s,u)
    #define textureCubeLod(s,u,l) textureCube(s,u)
    #define texture2DGrad(s,u,x,y) texture2D(s,u)
    #define textureCubeGrad(s,u,x,y) textureCube(s,u)
    #endif

`;


export const texture3D = `

    // #ifdef GL_OES_texture_3D
    // #extension GL_OES_texture_3D: enable
    // #endif

    #if !defined(GL_ES)||defined(GL_OES_texture_3D)
    #define tex3D(s,uvw,sl,su,sw,lw,l) texture3D(s,uvw,l)
    #ifdef GL_EXT_shader_texture_lod
    #define tex3DLod(s,uvw,l,sl,su,sw,lw) texture3DLod(s,uvw,l)
    #else
    #define tex3DLod(s,uvw,l,sl,su,sw,lw) texture3D(s,uvw)
    #endif
    #else
    #define sampler3D sampler2D
    vec4 tex3D(sampler2D s,vec3 uvw,float sl,bool su,bool sw,bool lw,float l)
    {
        float y;
        if(su) y=fract(uvw.y);
        else y=clamp(uvw.y,0.0,1.0);
        y/=sl;
        float z,s0,s1;
        z=uvw.z*sl;
        s0=floor(z);
        s1=s0+1.0;
        if(!sw){
            s0=clamp(s0,0.0,sl-1.0);
            s1=clamp(s0,0.0,sl-1.0);
        }
        s0/=sl;
        s1/=sl;
        z=fract(z);
        vec4 c0=texture2D(s,vec2(uvw.x,y+s0));
        vec4 c1=texture2D(s,vec2(uvw.x,y+s1));
        if(lw) return mix(c0,c1,z);
        return z<0.5?c0:c1;
    }
    #ifndef tex3DLod
    vec4 tex3DLod(sampler2D s,vec3 uvw,float l,float sl,bool su,bool sw,bool lw)
    {
        float y;
        if(su) y=fract(uvw.y);
        else y=clamp(uvw.y,0.0,1.0);
        y/=sl;
        float z,s0,s1;
        z=uvw.z*sl;
        s0=floor(z);
        s1=s0+1.0;
        if(!sw){
            s0=clamp(s0,0.0,sl-1.0);
            s1=clamp(s0,0.0,sl-1.0);
        }
        s0/=sl;
        s1/=sl;
        z=fract(z);
        vec4 c0=texture2DLod(s,vec2(uvw.x,y+s0),l);
        vec4 c1=texture2DLod(s,vec2(uvw.x,y+s1),l);
        if(lw) return mix(c0,c1,z);
        return z<0.5?c0:c1;
    }
    #endif
    #endif

`;

export const saturate = `

    float saturate(float x){
        return clamp(x,0.0,1.0);
    }

    vec2 saturate(vec2 x){
        return clamp(x,vec2(0.0),vec2(1.0));
    }

    vec3 saturate(vec3 x){
        return clamp(x,vec3(0.0),vec3(1.0));
    }

    vec4 saturate(vec4 x){
        return clamp(x,vec4(0.0),vec4(1.0));
    }

`;

export const clampToBorder = `

    vec4 clampToBorder(sampler2D ts, vec2 uv)
    {
        vec4 c = texture2D(ts, uv);
        if(uv.x>1.0 || uv.x<0.0) return vec4(0.0);
        if(uv.y>1.0 || uv.y<0.0) return vec4(0.0);
        return c;
    }

    vec4 clampToBorder(sampler2D ts, vec2 uv, vec2 clampUV)
    {
        vec4 c = texture2D(ts, uv);
        if(clampUV.x > 0.0 && (uv.x>1.0 || uv.x<0.0)) return vec4(0.0);
        if(clampUV.y > 0.0 && (uv.y>1.0 || uv.y<0.0)) return vec4(0.0);
        return c;
    }

    vec4 clampToBorder(sampler2D ts, vec2 uv, vec4 borderColor)
    {
        vec4 c = texture2D(ts, uv);
        if(uv.x>1.0 || uv.x<0.0) return borderColor;
        if(uv.y>1.0 || uv.y<0.0) return borderColor;
        return c;
    }

    vec4 clampToBorder(sampler2D ts, vec2 uv, vec2 clampUV, vec4 borderColor)
    {
        vec4 c = texture2D(ts, uv);
        if(clampUV.x > 0.0 && (uv.x>1.0 || uv.x<0.0)) return borderColor;
        if(clampUV.y > 0.0 && (uv.y>1.0 || uv.y<0.0)) return borderColor;
        return c;
    }

`;


export const getID = `

    vec2 getID(float id)
    {
        vec4 c2=vec4(1,0.00390625,0.00392156886,1.00392163);
        vec4 tmp;
        tmp.x=c2.x;
        tmp.y=tmp.x+id;
        tmp.z=tmp.y*c2.y;
        tmp.w=fract(tmp.z);
        tmp.w=(-tmp.w)+tmp.z;
        tmp.z=fract(abs(tmp.z));
        tmp.y=tmp.y>=0.0?tmp.z:(-tmp.z);
        return tmp.wy*c2.zw;
    }

`;

export const ldexp = `

    float ldexp (float mantissa, float exponent)
    {
        return exp2(exponent) * mantissa;
    }

`;

export const frexp = `

    float frexp (float f, out float exponent)
    {
        exponent = ceil(log2(f));
        float mantissa = exp2(-exponent) * f;
        return mantissa;
    }

`;

export const standardDerivatives = `

        #ifdef GL_OES_standard_derivatives
        #extension GL_OES_standard_derivatives: enable
        #endif

        #if defined(GL_ES)&&!defined(GL_OES_standard_derivatives)
        float dd(float x){return 0.0;}
        vec2 dd(vec2 x){return vec2(0.0);}
        vec3 dd(vec3 x){return vec3(0.0);}
        vec4 dd(vec4 x){return vec4(0.0);}
        #define dFdx(x) dd(x)
        #define dFdy(x) dd(x)
        #endif

`;

export const getWorldEyePositionFromViewMatrix = `

    vec3 getWorldEyePositionFromViewMatrix(mat4 m)
    {
        return vec3(m[0].w,m[1].w,m[2].w);
    }

`;

export const getWorldEyeDirectionFromViewMatrix = `

    vec3 getWorldEyeDirectionFromViewMatrix(mat4 m)
    {
        return vec3(m[0].z,m[1].z,m[2].z);
    }

`;

export const getNearPlaneFromProjectionMatrix = `

    float getNearPlaneFromProjectionMatrix(mat4 m)
    {
        return m[3][2]/m[2][2];
    }

`;

export const getFarPlaneFromProjectionMatrix = `

    float getFarPlaneFromProjectionMatrix(mat4 m)
    {
        return m[3][2]/(mat[2][2]+1.0);
    }

`;

export const getFieldOfViewFromProjectionMatrix = `

    float getFieldOfViewFromProjectionMatrix(mat4 m)
    {
        return 2.0*atan(1.0/m[1][1]);
    }

`;

export const srgbToLinear = `
    vec3 srgbToLinear(vec3 value)
    {
        bvec3 cutoff = lessThanEqual(value, vec3(0.04045));
        vec3 lowPart = value / 12.92;
        vec3 highPart = pow((value + 0.055) / 1.055, vec3(2.4));
        return mix(highPart, lowPart, vec3(cutoff));
    }
`;

export const linearToSrgb = `
    vec3 linearToSrgb(vec3 value)
    {
        value = max(value, vec3(0.0));
        bvec3 cutoff = lessThanEqual(value, vec3(0.0031308));
        vec3 lowPart = value * 12.92;
        vec3 highPart = 1.055 * pow(value, vec3(1.0 / 2.4)) - 0.055;
        return mix(highPart, lowPart, vec3(cutoff));
    }
`;