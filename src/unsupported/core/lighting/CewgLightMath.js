/**
 * CewgLightMath
 *
 * Shared, framework-free math helpers ported from carbonengine so the
 * Tr2*Light classes in this folder can reproduce Carbon's per-frame light
 * evaluation (LightData::AsPerPointLightData / AsPerSpotLightData /
 * Tr2Light::GetLight, see carbonengine trinity/trinity/Lights/Tr2Light.cpp)
 * and Tr2FactionLight's color saturation (carbonengine math/include/Color_inline.h).
 *
 * Kept as a plain, dependency-free module (no "utils"/"global" ccpwgl
 * aliases) so it is trivial to unit test outside webpack.
 */

/**
 * Minimal 32-bit Mersenne Twister (MT19937), matching the seeding/tempering
 * algorithm mandated by the C++ standard for `std::mt19937`. Used only to
 * reproduce TriPerlinNoise's fixed-seed gradient table
 * (carbonengine trinity/trinity/TriMath.cpp:1021-1027 uses `std::mt19937
 * randGen(seed)` seeded with a fixed seed of 0 - see PerlinNoise1D below).
 */
class Tr2MersenneTwister
{
    constructor(seed)
    {
        this._mt = new Uint32Array(624);
        this._mt[0] = seed >>> 0;
        for (let i = 1; i < 624; i++)
        {
            const prev = this._mt[i - 1] ^ (this._mt[i - 1] >>> 30);
            this._mt[i] = (Math.imul(1812433253, prev) + i) >>> 0;
        }
        this._index = 624;
    }

    _generate()
    {
        const mt = this._mt;
        for (let i = 0; i < 624; i++)
        {
            const y = (mt[i] & 0x80000000) + (mt[(i + 1) % 624] & 0x7fffffff);
            mt[i] = mt[(i + 397) % 624] ^ (y >>> 1);
            if (y % 2 !== 0) mt[i] ^= 2567483615;
        }
        this._index = 0;
    }

    Next()
    {
        if (this._index >= 624) this._generate();
        let y = this._mt[this._index];
        y ^= y >>> 11;
        y ^= (y << 7) & 2636928640;
        y ^= (y << 15) & 4022730752;
        y ^= y >>> 18;
        this._index++;
        return y >>> 0;
    }
}

/**
 * SCurve smoothstep, matches carbonengine trinity/trinity/TriMath.cpp:1014-1017
 * @param {Number} t
 * @returns {Number}
 */
function SCurve(t)
{
    return t * t * (3.0 - 2.0 * t);
}

/**
 * 1D Perlin noise with a fixed 256-entry gradient table, ported from
 * `TriPerlinNoise` (carbonengine trinity/trinity/TriMath.cpp:1021-1061 /
 * trinity/trinity/Include/TriMath.h:305-345).
 */
class Tr2PerlinNoise
{
    constructor(seed)
    {
        const TABLE_SIZE = 256;
        this._gradients = new Float64Array(TABLE_SIZE);
        const rng = new Tr2MersenneTwister(seed >>> 0);
        for (let i = 0; i < TABLE_SIZE; i++)
        {
            this._gradients[i] = ((rng.Next() % (TABLE_SIZE + TABLE_SIZE)) - TABLE_SIZE) / TABLE_SIZE;
        }
    }

    /**
     * Single-octave noise sample, matches TriPerlinNoise::operator()
     * @param {Number} x
     * @returns {Number}
     */
    Sample(x)
    {
        const TABLE_MASK = 255;
        const b0 = Math.floor(x) & TABLE_MASK;
        const b1 = (b0 + 1) & TABLE_MASK;

        const rx0 = x - Math.floor(x);
        const rx1 = rx0 - 1.0;

        const v0 = rx0 * this._gradients[b0];
        const v1 = rx1 * this._gradients[b1];

        return v0 + SCurve(rx0) * (v1 - v0);
    }

    /**
     * Fractal sum of octaves, matches TriPerlinNoise::FractalSum
     * @param {Number} x
     * @param {Number} octaves
     * @param {Number} [amplitudeScale=0.5]
     * @param {Number} [frequencyScale=2]
     * @returns {Number}
     */
    FractalSum(x, octaves, amplitudeScale = 0.5, frequencyScale = 2)
    {
        let sum = 0.0;
        let scale = 1.0;
        for (let i = 0; i < octaves; i++)
        {
            sum += this.Sample(x) * scale;
            scale *= amplitudeScale;
            x *= frequencyScale;
        }
        return sum;
    }
}

// Fixed seed 0, matches `static TriPerlinNoise noise{ 0 }` in
// carbonengine trinity/trinity/TriMath.cpp:1065 ("fixed seed: reproducible
// across runs").
const s_perlinNoise = new Tr2PerlinNoise(0);

/**
 * Free function matching carbonengine's `PerlinNoise1D(x, invAmplitude, frequency, octaves)`
 * (trinity/trinity/TriMath.cpp:1063-1067). Note this is the exact function
 * Tr2Light.cpp calls with the literal constants `2.f, 2.f` (NOT the light's
 * own noiseAmplitude/noiseFrequency - see `ComposeNoiseBrightness` below,
 * which reproduces that call site faithfully).
 * @param {Number} x
 * @param {Number} invAmplitude
 * @param {Number} frequency
 * @param {Number} octaves
 * @returns {Number}
 */
export function PerlinNoise1D(x, invAmplitude, frequency, octaves)
{
    return s_perlinNoise.FractalSum(x, Math.max(0, octaves | 0), 1.0 / invAmplitude, frequency);
}

/**
 * Reproduces the noise-modulated brightness composition performed inline in
 * `LightData::AsPerPointLightData` (carbonengine trinity/trinity/Lights/Tr2Light.cpp:42-47):
 *
 *   composedBrightness = brightness * features.parentBrightness;
 *   if (noiseAmplitude != 0.f) {
 *       noise = PerlinNoise1D(elapsed * noiseFrequency, 2.f, 2.f, noiseOctaves);
 *       composedBrightness *= ((noise + 1.0f) / 2.0f) * noiseAmplitude;
 *   }
 *
 * Note the `2.f, 2.f` passed to PerlinNoise1D are literal constants in
 * Carbon's source (amplitude-scale 0.5 / frequency-scale 2 for the fractal
 * sum), not the light's own noiseAmplitude/noiseFrequency - those are only
 * used to scale the time input (`elapsed * noiseFrequency`) and the final
 * result (`* noiseAmplitude`).
 * @param {Number} brightness
 * @param {Number} parentBrightness
 * @param {Number} noiseAmplitude
 * @param {Number} noiseFrequency
 * @param {Number} noiseOctaves
 * @param {Number} elapsedSeconds time elapsed since the light's "start time" (Carbon: `BeOS->GetCurrentFrameTime() - m_startTime`)
 * @returns {Number}
 */
export function ComposeNoiseBrightness(brightness, parentBrightness, noiseAmplitude, noiseFrequency, noiseOctaves, elapsedSeconds)
{
    let composed = brightness * parentBrightness;
    if (noiseAmplitude !== 0)
    {
        const noise = PerlinNoise1D(elapsedSeconds * noiseFrequency, 2.0, 2.0, noiseOctaves);
        composed *= ((noise + 1.0) / 2.0) * noiseAmplitude;
    }
    return composed;
}

/**
 * Saturates an [r,g,b,a] color, matching `Saturate(const Color&, float)`
 * (carbonengine math/include/Color_inline.h:161-172). `saturation` 0 =
 * grayscale, 1 = unchanged, >1 over-saturates; negative values are clamped
 * to 0 (matching Carbon's `std::max(0.0f, saturation)`).
 * @param {Number[]} color [r,g,b,a]
 * @param {Number} saturation
 * @param {Number[]} [out]
 * @returns {Number[]}
 */
export function Saturate(color, saturation, out = [ 0, 0, 0, 0 ])
{
    if (saturation === 1)
    {
        out[0] = color[0];
        out[1] = color[1];
        out[2] = color[2];
        out[3] = color[3];
        return out;
    }

    // Perceptual luminance weights, matches Color_inline.h:169
    const i = (color[0] * 0.299) + (color[1] * 0.587) + (color[2] * 0.114);
    const s = Math.max(0.0, saturation);

    out[0] = i + (color[0] - i) * s;
    out[1] = i + (color[1] - i) * s;
    out[2] = i + (color[2] - i) * s;
    out[3] = color[3];
    return out;
}

/**
 * CewgLightList (src/core/cewg/CewgLightList.js) reverse-engineered its
 * Buffer B "flags" field from shipped DX11 bytecode and only confirmed a
 * single bit: 0x10000 = enabled. Any other bits (shadow casting, volumetric,
 * light-profile index etc - all of which exist in Carbon's own
 * Tr2LightManager::PerLightData/flags, see Tr2LightManager.h:100-105 and
 * Tr2Light.cpp:52,64,66) are NOT confirmed for the CEWG shader contract, so
 * GetCewgLightData() implementations in this folder only ever set this one
 * bit - see the TODOs on each GetCewgLightData() for details.
 * @type {Number}
 */
export const CEWG_FLAG_ENABLED = 0x10000;

/**
 * Average length of a mat4's three basis (axis) vectors - a cheap
 * "world scale" estimate for a transform whose scale isn't necessarily
 * uniform. Used as the `parentScale` passed to `Tr2*Light#GetCewgLightData`
 * by light-owning nodes that have no single scalar scale of their own
 * (see the `GetLights(collector, parentContext)` hooks on
 * EveChildContainer / EveEffectRoot2 / EveStretch). This is a ccpwgl-side
 * convenience, not a ported Carbon function.
 * @param {mat4} m
 * @returns {Number}
 */
export function GetAverageAxisScale(m)
{
    const ax = Math.hypot(m[0], m[1], m[2]);
    const ay = Math.hypot(m[4], m[5], m[6]);
    const az = Math.hypot(m[8], m[9], m[10]);
    return (ax + ay + az) / 3;
}

export { Tr2PerlinNoise, Tr2MersenneTwister, SCurve };
