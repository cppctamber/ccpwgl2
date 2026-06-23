
// Requires clampToBorder
export const approximateFWidth = `

    float approxFwidthRGB_border(sampler2D tex, vec2 uv, float uvStep)
    {
        vec2 dx = vec2(uvStep, 0.0);
        vec2 dy = vec2(0.0, uvStep);

        vec3 cpx = clampToBorder(tex, uv + dx).xyz;
        vec3 cmx = clampToBorder(tex, uv - dx).xyz;
        vec3 cpy = clampToBorder(tex, uv + dy).xyz;
        vec3 cmy = clampToBorder(tex, uv - dy).xyz;

        vec3 dd = abs(cpx - cmx) + abs(cpy - cmy); // abs(ddx)+abs(ddy)
        return length(dd);
    }

`;

export const chromaWithoutTexel = `

    // Chroma-only color distance
    vec3 rgbToYCbCr(vec3 c)
    {
        float Y  = dot(c, vec3(0.299, 0.587, 0.114));
        float Cb = (c.b - Y) * 0.564;
        float Cr = (c.r - Y) * 0.713;
        return vec3(Y, Cb, Cr);
    }

    float bgDistance(vec3 rgb, vec3 bgRGB)
    {
        vec3 a = rgbToYCbCr(rgb);
        vec3 b = rgbToYCbCr(bgRGB);
        return length(a.yz - b.yz);
    }

`;

export const chromaWithTexel = `

    vec2 getTexelSize(sampler2D decal)
    {
        ivec2 size = textureSize(decal, 0);
        return vec2 texelSize = 1.0 / vec2(size);
    }

    vec3 rgbToYCbCr(vec3 c)
    {
        float Y  = dot(c, vec3(0.299, 0.587, 0.114));
        float Cb = (c.b - Y) * 0.564;
        float Cr = (c.r - Y) * 0.713;

        // Compression-tolerant color distance (chroma-weighted)
        return vec3(Y, Cb, Cr);
    }

    float bgDistance(vec3 rgb, vec3 bgColor)
    {
        vec3 a = rgbToYCbCr(rgb);
        vec3 b = rgbToYCbCr(bgColor);

        // chroma distance
        return length(a.yz - b.yz);
    }

    float bgMatch(sampler2d decal, vec2 uv, float tolerance, float softness)
    {
        float d = bgDistance(texture2d(decal, uv).rgb);

        // 1 = background-like, 0 = not background
        return 1.0 - smoothstep(tolerance,tolerance + max(softness, 1e-6), d);
    }

    // Require neighbors to agree it's background
    float groupGate(sampler2d decal, vec2 uv, vec2 texel, float tolerance)
    {
        float sum = 0.0;

        for (int y = -1; y <= 1; y++)
        for (int x = -1; x <= 1; x++)
            sum += bgMatch(decal, uv + vec2(x,y) * texel, tolerance, softness);

        // 9 samples total
        return step(uGroupMin * 9.0, sum);
    }

`;


export const keyRange = `

    // Range based color keying
    // Use when the background isn't one colour but is within a range
    // e.g. we have a compressed source image

    float keyRange(vec3 c, vec3 minKey, vec3 maxKey, float softness)
    {
        vec3 below = minKey - c;
        vec3 above = c - maxKey;
        vec3 outside = max(max(below, above), vec3(0.0));
        float d = length(outside);
        return 1.0 - smoothstep(0.0, max(softness,1e-6), d); // 1 inside range
    }

`;