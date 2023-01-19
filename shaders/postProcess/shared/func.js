// https://github.com/Jam3/glsl-fast-gaussian-blur
export const blur13 = `
    vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction)
     {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.411764705882353) * direction;
        vec2 off2 = vec2(3.2941176470588234) * direction;
        vec2 off3 = vec2(5.176470588235294) * direction;
        color += texture2D(image, uv) * 0.1964825501511404;
        color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
        color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
        color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
        color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
        color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
        color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
        return color;
    }
`;

// https://github.com/Jam3/glsl-fast-gaussian-blur
export const blur9 = `

    vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
      vec4 color = vec4(0.0);
      vec2 off1 = vec2(1.3846153846) * direction;
      vec2 off2 = vec2(3.2307692308) * direction;
      color += texture2D(image, uv) * 0.2270270270;
      color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
      color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
      color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
      color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
      return color;
    }

`;

// https://github.com/Jam3/glsl-fast-gaussian-blur
export const blur5 = `

    vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
      vec4 color = vec4(0.0);
      vec2 off1 = vec2(1.3333333333333333) * direction;
      color += texture2D(image, uv) * 0.29411764705882354;
      color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
      color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
      return color; 
    }
    
`;

// https://github.com/mattdesl/glsl-random/blob/master/index.glsl
export const random = `

    highp float random(vec2 co) {
        highp float a = 12.9898;
        highp float b = 78.233;
        highp float c = 43758.5453;
        highp float dt= dot(co.xy ,vec2(a,b));
        highp float sn= mod(dt,3.14);
        return fract(sin(sn) * c);
    }

`;


// https://github.com/Jam3/glsl-blend-overlay/blob/master/index.glsl
export const blendOverlay = `
    
    vec3 blendOverlay(vec3 base, vec3 blend){
        return mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));
    }

`;

export const toLinearDepth = `

    float toLinearDepth(float depth, vec2 plane)
    {
         float ndc = 2.0 * depth - 1.0;
         return -(2.0 * plane.y * plane.x) / (ndc * (plane.y - plane.x) - plane.y - plane.x);
    }

`;

export const fromLinearDepth = `

    float fromLinearDepth(float linearDepth, vec2 plane)
    {
        float nonLinearDepth = (plane.y + plane.x - 2.0 * plane.x * plane.y / linearDepth) / (plane.y - plane.x);
        return (nonLinearDepth + 1.0) / 2.0;    
    }
`;

export const texFetch = `

    vec4 texFetch(sampler2D sampler, vec2 uv, vec2 resolution)
    {
        return texture2D(sampler, (2.0*uv+vec2(1.0))/2.0 * resolution.xy);                    
    }
                    
`;


export const packing = `

    vec3 packNormalToRGB( vec3 normal )
    {
        return normalize( normal ) * 0.5 + 0.5;
    }
    
    vec3 unpackRGBToNormal( vec3 rgb )
    {
        return 2.0 * rgb.xyz - 1.0;
    }
    
    const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
    
    const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
    
    const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
    
    const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
    
    const float ShiftRight8 = 1. / 256.;
    
    vec4 packDepthToRGBA( float v ) {
        vec4 r = vec4( fract( v * PackFactors ), v );
        r.yzw -= r.xyz * ShiftRight8; // tidy overflow
        return r * PackUpscale;
    }
    
    float unpackRGBAToDepth( vec4 v ) {
        return dot( v, UnpackFactors );
    }
    
    vec2 packDepthToRG( float v ) {
        return packDepthToRGBA( v ).yx;
    }
    
    float unpackRGToDepth( vec2 v ) {
        return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
    }
    
    vec4 pack2HalfToRGBA( vec2 v ) {
        vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
        return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
    }
    
    vec2 unpackRGBATo2Half( vec4 v ) {
        return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
    }
    
    // NOTE: viewZ/eyeZ is < 0 when in front of the camera per OpenGL conventions
    float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
        return ( viewZ + near ) / ( near - far );
    }
    
    float orthographicDepthToViewZ( float linearClipZ, float near, float far ) {
        return linearClipZ * ( near - far ) - near;
    }
    
    // NOTE: https://twitter.com/gonnavis/status/1377183786949959682
    float viewZToPerspectiveDepth( float viewZ, float near, float far ) {
        return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
    }
    
    float perspectiveDepthToViewZ( float invClipZ, float near, float far ) {
        return ( near * far ) / ( ( far - near ) * invClipZ - far );
    }
    
`;

