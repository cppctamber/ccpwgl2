export const calculateOutline = `

    vec4 calculateOutline(float thickness, vec4 pos, vec3 normal, vec4 skinned)
    {
        const float ratio = 1.0;
        vec4 pos2 = projectionMatrix
    }

`;


export const getVec2FromID = `

    vec2 getVec2FromID(float id)
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

export const isMasked = `

    bool isMasked(sampler2D maskMap, vec2 uv, float multiplier)
    {
        float x = texture2D(maskMap, uv).x * multiplier;
        return x > 0.0;     
    }
    
    bool isMasked(sampler2D maskMap, vec2 uv)
    {
        float x = texture2D(maskMap, uv).x;
        return x > 0.0;     
    }

`;

let amount = 0.33 / 2;

export const getMaterialMask = `

    vec4 getMaterialMask(sampler2D materialSampler,vec2 uv)
    {
        vec4 v0;
        float material=texture2D(materialSampler,uv).x;
        if      (material<${  amount}) {v0.x=1.0;}
        else if (material>${1-amount}) {v0.w=1.0;}
        else if (material<${3*amount}) {v0.y=1.0;} 
        else                           {v0.z=1.0;}
        return v0;
    }
    
`;

export const getPatternLayer = `
    
    float getPatternLayer(sampler2D pattern,vec2 uv,vec2 clamp,vec4 mask,vec4 materialMask)
    {
        float p=clampToBorder(pattern,uv,clamp).x;
        if (any(greaterThan(mask*materialMask*p,vec4(0.0)))) return p;
        return 0.0;
    }
     
`;

export const pulse = `

    // Todo: Replace with proper method
    vec4 pulse(float modifier, float time, vec3 base, vec4 color)
    {
        vec4 result;
        result.w=color.w;
        if(any(greaterThan(color.xyz,vec3(0.0)))){
            if (modifier>0.0){
                result.x=fract(time);
                if(result.x>0.5)result.x=1.0-result.x;
                result.x=min(1.0,time*modifier);
            }
            else result.x=1.0;
            result.xyz=base*color.xyz*result.x;
        }
        return result;
    }

`;