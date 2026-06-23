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

/*

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

 */

export const getMaterialMask = `

    vec4 getMaterialMask(float m)
    {
        float d=0.01;
        float s=1.0/(1.0/3.0-2.0*d);
        float o=1.0+d*s;
        return saturate(vec4(o)-abs(s*(vec4(m)-vec4(0.0,1.0/3.0,2.0/3.0,1.0))));
    }

    vec4 getMaterialMask(sampler2D materialSampler,vec2 uv)
    {
        return getMaterialMask(texture2D(materialSampler,uv).x);
    }

    int getMaterialIndex(float m)
    {
        vec4 mask = getMaterialMask(m);
        if (mask.x > 0.0) return 0;
        if (mask.y > 0.0) return 1;
        if (mask.z > 0.0) return 2;
        if (mask.w > 0.0) return 3;
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



export const dirtFunctions = `

    const vec4 DIRT_FRESNEL_COLOR = vec4(0.019,0.017,0.014);
    const vec4 DIRT_ALBEDO_COLOR =vec4(0.13,0.09,0.1,0.0);
    const float DIRT_GLOSS = 0.4;
    const float DIRT_TILING = 20.0;

    struct Material {
        vec3 albedo
        vec3 fresnel
        float gloss
        float roughness
        float dirt
        float dirtDetail
    };

    float getDirtLevel(float dirt, float detail, float level)
    {
        float level = detail*dirt/(1.0-level)
        // saturate
        return float clamp(x,0.0,1.0);
    }

    float getDirtDetail(sampler2D dustNoiseMap, vec2 uv, float tiling)
    {
        return vec4(0.5)+texture2D(dirtMap, uv*vec2(tiling);
    }

    vec4 combineDirtWithMaterial(
        vec4 dustNoiseMap,
        float dirt,
        float dirtLevel,
        vec4 dirtColor,
        vec4 materialColor // Is this the combined or pre combined color??
    )
    {
        float detail = dustNoiseMap.w;
        float amount = getDirtLevel(dirt,detail,dirtLevel);
        vec4(pow((1.0-amount),3.0)*materialColor+dirtColor*dirtAmount;
    }

    Material getDirtMaterial(
        vec3 albedoMap,
        vec2 fresnel,
        float gloss,
        float roughness,
        vec3 dirtDiffuseColor,
        vec4 dirtDetail,
    )
    {
        Material dirt;
        dirt.albedo = dirtDiffuseColor*albedoMap*dirtDetail.x;
        dirt.fresnel = DIRT_FRESNEL_COLOR*dirtDetail.y;
        dirt.gloss = gloss;
        dirt.roughness = 1.0-DIRT_GLOSS*roughness*dirtDetail.z;
        // Saturate results
        dirt.roughness = clamp(dirt.roughness, 0.0, 1.0);
        dirt.roughness = dirt.roughness * dirt.roughness;
        return dirt;
    }



`;
