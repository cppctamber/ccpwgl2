
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

