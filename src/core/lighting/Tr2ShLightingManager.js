import { meta } from "utils";
import { vec3 } from "math";


const SQRT_PI = Math.sqrt(Math.PI);

/** Carbon `s_cutoffRadiusRatio` (Tr2ShLightingManager.cpp:14) */
const CUTOFF_RADIUS_RATIO = 0.045 * 7;

/** `ShSolver<L1>` pack coefficients (Tr2ShLightingManager.cpp:62-72) */
const L1_PACK_0 = 1 / (2 * SQRT_PI);
const L1_PACK_1 = Math.sqrt(3) / (3 * SQRT_PI);

/**
 * `ShSolver<L1>::s_normalizationCoefficients`. Carbon writes these as unevaluated
 * products; they are kept in that form so every factor stays checkable against the
 * source rather than collapsing into an opaque literal.
 */
const L1_NORMALIZATION = [
    2 * SQRT_PI * 0.282094791773878140 * Math.sqrt(0.3141593e1),
    2 / 3 * Math.sqrt(3 * Math.PI) * -0.488602511902919920 * (Math.sqrt(3) * Math.sqrt(0.3141593e1) / 2),
    2 / 3 * Math.sqrt(3 * Math.PI) * 0.488602511902919920 * (Math.sqrt(3) * Math.sqrt(0.3141593e1) / 2),
    2 / 3 * Math.sqrt(3 * Math.PI) * -0.488602511902919920 * (Math.sqrt(3) * Math.sqrt(0.3141593e1) / 2)
];

/** `ShSolver<L2>` pack coefficients (Tr2ShLightingManager.cpp:148-169) */
const L2_PACK_0 = 1 / (2 * SQRT_PI);
const L2_PACK_1 = Math.sqrt(3) / (3 * SQRT_PI);
const L2_PACK_2 = Math.sqrt(15) / (8 * SQRT_PI);
const L2_PACK_3 = Math.sqrt(5) / (16 * SQRT_PI);
const L2_PACK_4 = 0.5 * L2_PACK_2;

/** `ShSolver<L2>::s_normalizationCoefficients` */
const L2_NORMALIZATION = [
    2 * SQRT_PI * 0.282094791773878140 * Math.sqrt(0.3141593e1),
    2 / 3 * Math.sqrt(3 * Math.PI) * -0.488602511902919920 * (Math.sqrt(3) * Math.sqrt(0.3141593e1) / 2),
    2 / 3 * Math.sqrt(3 * Math.PI) * 0.488602511902919920 * (Math.sqrt(3) * Math.sqrt(0.3141593e1) / 2),
    2 / 3 * Math.sqrt(3 * Math.PI) * -0.488602511902919920 * (Math.sqrt(3) * Math.sqrt(0.3141593e1) / 2),
    2 / 5 * Math.sqrt(5 * Math.PI) * 0.546274215296039590 * (-Math.sqrt(5) * Math.sqrt(0.3141593e1) / 2),
    2 / 5 * Math.sqrt(5 * Math.PI) * -1.092548430592079200 * (-Math.sqrt(5) * Math.sqrt(0.3141593e1) / 2),
    2 / 5 * Math.sqrt(5 * Math.PI) * -0.315391565252520050 * (-Math.sqrt(5) * Math.sqrt(0.3141593e1) / 2),
    2 / 5 * Math.sqrt(5 * Math.PI) * -1.092548430592079200 * (-Math.sqrt(5) * Math.sqrt(0.3141593e1) / 2),
    2 / 5 * Math.sqrt(5 * Math.PI) * 0.546274215296039590 * (-Math.sqrt(5) * Math.sqrt(0.3141593e1) / 2)
];

/**
 * Largest component of a three component colour
 * @param {vec3|Number[]} v
 * @returns {Number}
 */
function maxComponent(v)
{
    return Math.max(v[0], v[1], v[2]);
}


/**
 * Tr2ShLightingManager
 *
 * Source: carbonengine trinity/trinity/Tr2ShLightingManager.h/.cpp/_Blue.cpp.
 * Computes spherical-harmonics coefficients approximating "secondary"
 * lighting: light from a single primary directional light (the sun),
 * bounced off nearby small emissive/albedo spheres ("secondary light
 * sources") and a list of registered Tr2PointLight "primary" sources, so
 * that small nearby objects get a cheap ambient contribution without a full
 * lighting pass. Order (`quality`) is either L1 (4 SH coefficients) or L2
 * (9 SH coefficients), each packed down to `PACKED_COEFFICIENT_COUNT` (7)
 * Vector4s for shader consumption.
 */
@meta.type("Tr2ShLightingManager")
@meta.ccp.define("Tr2ShLightingManager")
export class Tr2ShLightingManager extends meta.Model
{

    /**
     * SH lighting order (quality) ordinals, matches `Tr2ShLightingManager::Quality`
     * (Tr2ShLightingManager.h:34-38).
     */
    static L1 = 0;
    static L2 = 1;

    /**
     * Matches `Tr2ShLightingManager::PACKED_COEFFICIENT_COUNT` (Tr2ShLightingManager.h:51)
     */
    static PACKED_COEFFICIENT_COUNT = 7;

    @meta.float
    primaryIntensity = 1;

    @meta.float
    secondaryIntensity = 1;

    /**
     * SH lighting order (quality): 0=L1 (4 coefficients), 1=L2 (9
     * coefficients), default L2 - Carbon persists this as a Blue ENUM
     * chooser ("ShQuality", Tr2ShLightingManager_Blue.cpp:10-16).
     *
     * TODO(wire type): deliberately NOT decorated with a black reader type.
     * ccpwgl black readers dispatch on decorator type and the wire encoding
     * of Blue enum choosers is unverified (ccpwgl's `enums` reader parses a
     * string, scalar readers read fixed bytes - guessing wrong corrupts the
     * rest of the object stream). The pre-existing stub omitted this
     * property entirely, so leaving it unregistered preserves existing
     * reader behavior; verify against a real .black file before decorating.
     * @type {Number}
     */
    quality = 1;

    @meta.notImplemented
    @meta.desc("Additional Tr2PointLight 'primary' sources treated as secondary-lighting sources (Carbon: PTr2PointLightVector m_lights, Be::READ|PERSIST).")
    @meta.list("Tr2PointLight")
    lights = [];

    /**
     * Registered secondary light sources (spheres with albedo/emissive
     * color). Carbon stores raw pointers into caller-owned data
     * (`TrackableStdVector<Source> m_sources`, Tr2ShLightingManager.h:76);
     * this instead stores the source descriptor objects themselves by
     * reference - callers should mutate the object's fields in place if
     * they want live updates, rather than replacing it.
     * @type {Array<{position:Number[], radius:Number, albedo:Number[], emissive:Number[]}>}
     * @private
     */
    _sources = [];

    /**
     * Packed/processed source data rebuilt each `UpdateWithDirectionalLight`
     * call. Carbon: `m_sourceData` (a raw aligned buffer of `SourceData`
     * structs, Tr2ShLightingManager.h:79).
     * @private
     */
    _sourceData = [];

    /** @private */
    _sunDirection = vec3.fromValues(0, 1, 0);

    /** @private */
    _sunColor = vec3.fromValues(0, 0, 0);

    /**
     * Registers a secondary light source
     *
     * Matches `Tr2ShLightingManager::RegisterSecondaryLightSource`
     * (Tr2ShLightingManager.cpp:251-259).
     * @param {{position:Number[], radius:Number, albedo:Number[], emissive:Number[]}} source
     */
    RegisterSecondaryLightSource(source)
    {
        this._sources.push(source);
    }

    /**
     * Unregisters a previously registered secondary light source
     *
     * Matches `Tr2ShLightingManager::UnregisterSecondaryLightSource`
     * (Tr2ShLightingManager.cpp:268-278). Carbon matches by position
     * pointer identity; this matches by source object identity instead
     * (see `_sources` doc).
     * @param {{position:Number[], radius:Number, albedo:Number[], emissive:Number[]}} source
     */
    UnregisterSecondaryLightSource(source)
    {
        const index = this._sources.indexOf(source);
        if (index !== -1) this._sources.splice(index, 1);
    }

    /**
     * Updates the manager with the current directional (sun) light and
     * rebuilds packed source data
     *
     * Matches `Tr2ShLightingManager::UpdateWithDirectionalLight`
     * (Tr2ShLightingManager.cpp:288-295).
     * @param {Number[]} direction
     * @param {Number[]} color
     */
    UpdateWithDirectionalLight(direction, color)
    {
        vec3.copy(this._sunColor, color);
        vec3.normalize(this._sunDirection, direction);
        this.UpdateSourceData();
    }

    /**
     * Rebuilds `_sourceData` from registered secondary sources and `lights`
     *
     * Matches `Tr2ShLightingManager::UpdateSourceData` (Tr2ShLightingManager.cpp:394-437):
     * secondary sources with `radius > 0` are scaled by `secondaryIntensity`;
     * each entry in `lights` contributes its `GetLight()` triple scaled by
     * `primaryIntensity` (with `cutoffMultiplier = 0`, i.e. never culled by
     * the radius/cutoffRadius test in `CalculateSecondaryLighting`).
     */
    UpdateSourceData()
    {
        const data = [];
        const maxLight = maxComponent(this._sunColor);

        for (let i = 0; i < this._sources.length; i++)
        {
            const source = this._sources[i];
            if (source.radius > 0)
            {
                const albedo = [
                    source.albedo[0] * this.secondaryIntensity,
                    source.albedo[1] * this.secondaryIntensity,
                    source.albedo[2] * this.secondaryIntensity
                ];

                const emissive = [
                    source.emissive[0] * this.secondaryIntensity,
                    source.emissive[1] * this.secondaryIntensity,
                    source.emissive[2] * this.secondaryIntensity
                ];

                data.push({
                    position: [ source.position[0], source.position[1], source.position[2] ],
                    radius: source.radius,
                    albedo,
                    cutoffMultiplier: 1,
                    emissive,
                    maxColorComponent: Math.max(maxComponent(albedo) * maxLight, maxComponent(emissive))
                });
            }
        }

        for (let i = 0; i < this.lights.length; i++)
        {
            const light = this.lights[i];
            if (typeof light.GetLight !== "function") continue;
            const { position, radius, color } = light.GetLight();

            const emissive = [
                color[0] * this.primaryIntensity,
                color[1] * this.primaryIntensity,
                color[2] * this.primaryIntensity
            ];

            data.push({
                position: [ position[0], position[1], position[2] ],
                radius,
                albedo: [ 0, 0, 0 ],
                cutoffMultiplier: 0,
                emissive,
                maxColorComponent: maxComponent(emissive)
            });
        }

        this._sourceData = data;
    }

    /**
     * Evaluates SH lighting coefficients for a sample position
     *
     * Matches `Tr2ShLightingManager::GetLighting` (Tr2ShLightingManager.cpp:371-383).
     * The result is the flat 28 float block the `ShLighting` per object slot
     * expects, not an array of vectors.
     *
     * @param {Number[]} position - receiver position
     * @param {Number} intensity - overall scale, usually a distance fade
     * @param {Number} cutoffRadius - spheres smaller than this are skipped
     * @param {Float32Array} [out] - 28 floats, allocated when omitted
     * @returns {Float32Array} out
     */
    GetLighting(position, intensity, cutoffRadius, out)
    {
        if (!out) out = new Float32Array(Tr2ShLightingManager.PACKED_COEFFICIENT_COUNT * 4);
        else out.fill(0);

        const order = this.quality === Tr2ShLightingManager.L2 ? 3 : 2;
        return this.CalculateSecondaryLighting(position, intensity, cutoffRadius, out, order);
    }

    /**
     * Accumulates every visible source's contribution into `order * order` RGB
     * coefficients, then normalizes and packs them.
     *
     * Matches Carbon's `CalculateSecondaryLighting<Order>` (Tr2ShLightingManager.cpp:306-360).
     *
     * @param {Number[]} position - receiver position
     * @param {Number} intensity - overall scale
     * @param {Number} cutoffRadius - sphere cull radius
     * @param {Float32Array} out - 28 floats
     * @param {Number} order - 2 for L1, 3 for L2
     * @returns {Float32Array} out
     */
    CalculateSecondaryLighting(position, intensity, cutoffRadius, out, order)
    {
        const count = order * order;
        const sh = new Float64Array(count * 3);
        const basis = new Float64Array(count);
        const direction = Tr2ShLightingManager.global.direction;

        for (let i = 0; i < this._sourceData.length; i++)
        {
            const source = this._sourceData[i];

            if (source.radius < cutoffRadius * source.cutoffMultiplier) continue;

            vec3.subtract(direction, source.position, position);

            const distance = vec3.length(direction);
            const oneOverDistance = 1 / distance;

            vec3.scale(direction, direction, oneOverDistance);

            // Carbon's skip test reads the W LANE of vectors loaded as float4 from
            // packed struct members, so the values it actually compares are the
            // members that FOLLOW position and emissive in the struct: radius and
            // maxColorComponent (Tr2ShLightingManager.cpp:330-338). A source is
            // skipped when its apparent brightness falls below the cutoff ratio,
            // when the receiver sits within one unit of it, or when the distance
            // is not finite.
            const apparentBrightness = source.radius * oneOverDistance * source.maxColorComponent;

            if (!isFinite(distance) || apparentBrightness < CUTOFF_RADIUS_RATIO || distance < 1) continue;

            if (order === 3) Tr2ShLightingManager.EvalSphericalLightL2(direction, distance, source.radius, basis);
            else Tr2ShLightingManager.EvalSphericalLightL1(direction, distance, source.radius, basis);

            // The albedo term is lit by the primary light through a wrapped dot
            // product, so a sphere facing away still reflects a little; the
            // emissive term is added unlit.
            const dot = vec3.dot(this._sunDirection, direction) * 0.5 + 0.5;

            for (let channel = 0; channel < 3; channel++)
            {
                const color = dot * source.albedo[channel] * this._sunColor[channel] + source.emissive[channel];

                for (let index = 0; index < count; index++)
                {
                    sh[index * 3 + channel] += basis[index] * color;
                }
            }
        }

        const normalization = order === 3 ? L2_NORMALIZATION : L1_NORMALIZATION;

        for (let index = 0; index < count; index++)
        {
            const scale = normalization[index] * intensity;

            sh[index * 3] *= scale;
            sh[index * 3 + 1] *= scale;
            sh[index * 3 + 2] *= scale;
        }

        return order === 3
            ? Tr2ShLightingManager.PackL2(sh, out)
            : Tr2ShLightingManager.PackL1(sh, out);
    }

    /**
     * The solid angle a sphere of `radius` subtends at `distance`, projected onto
     * the four L1 basis functions. A receiver inside the sphere sees the whole
     * hemisphere.
     *
     * Matches `ShSolver<L1>::SHEvalSphericalLight` (Tr2ShLightingManager.cpp:29-53).
     *
     * @param {vec3} direction - unit direction to the source
     * @param {Number} distance - distance to the source centre
     * @param {Number} radius - source radius
     * @param {Float64Array} out - four basis values
     */
    static EvalSphericalLightL1(direction, distance, radius, out)
    {
        let o0 = 1;
        let o1 = 1;

        if (distance > radius)
        {
            o1 = (radius / distance) * (radius / distance);
            o0 = 1 - Math.sqrt(1 - o1);
        }

        out[0] = o0;
        out[1] = direction[1] * o1;
        out[2] = direction[2] * o1;
        out[3] = direction[0] * o1;
    }

    /**
     * The same solid angle against the nine L2 basis functions, through Carbon's
     * cap integral.
     *
     * Matches `ShSolver<L2>::SHEvalSphericalLight` (Tr2ShLightingManager.cpp:100-140).
     *
     * @param {vec3} direction - unit direction to the source
     * @param {Number} distance - distance to the source centre
     * @param {Number} radius - source radius
     * @param {Float64Array} out - nine basis values
     */
    static EvalSphericalLightL2(direction, distance, radius, out)
    {
        let sinAngle = 1;
        let cosAngle = 0;

        if (distance > radius)
        {
            sinAngle = radius / distance;
            cosAngle = Math.sqrt(1 - sinAngle * sinAngle);
        }

        // ComputeCapInt (Tr2ShLightingManager.cpp:174-179)
        const cap0 = -cosAngle + 1;
        const cap1 = sinAngle * sinAngle;
        const cap2 = cosAngle * (cosAngle * cosAngle - 1);

        // EvalBasis (Tr2ShLightingManager.cpp:181-192)
        const x = direction[0];
        const y = direction[1];
        const z = direction[2];

        out[0] = 1 * cap0;
        out[1] = y * cap1;
        out[2] = z * cap1;
        out[3] = x * cap1;
        out[4] = (x * y + y * x) * cap2;
        out[5] = (z * y) * cap2;
        out[6] = (3 * (z * z) - 1) * cap2;
        out[7] = (z * x) * cap2;
        out[8] = (x * x - y * y) * cap2;
    }

    /**
     * L1 fills only the FIRST THREE packed vec4s; Carbon leaves the remaining four
     * untouched, so a caller that wants them clear zeroes the destination first.
     *
     * Matches `ShSolver<L1>::PackCoefficients` (Tr2ShLightingManager.cpp:62-72).
     *
     * @param {Float64Array} sh - normalized coefficients, RGB interleaved
     * @param {Float32Array} out - 28 floats
     * @returns {Float32Array} out
     */
    static PackL1(sh, out)
    {
        for (let channel = 0; channel < 3; channel++)
        {
            out[channel * 4] = -L1_PACK_1 * sh[3 * 3 + channel];
            out[channel * 4 + 1] = -L1_PACK_1 * sh[1 * 3 + channel];
            out[channel * 4 + 2] = L1_PACK_1 * sh[2 * 3 + channel];
            out[channel * 4 + 3] = L1_PACK_0 * sh[0 * 3 + channel];
        }

        return out;
    }

    /**
     * All seven vec4s, the last carrying a constant 1 in its w lane.
     *
     * Matches `ShSolver<L2>::PackCoefficients` (Tr2ShLightingManager.cpp:148-169).
     *
     * @param {Float64Array} sh - normalized coefficients, RGB interleaved
     * @param {Float32Array} out - 28 floats
     * @returns {Float32Array} out
     */
    static PackL2(sh, out)
    {
        for (let channel = 0; channel < 3; channel++)
        {
            out[channel * 4] = -L2_PACK_1 * sh[3 * 3 + channel];
            out[channel * 4 + 1] = -L2_PACK_1 * sh[1 * 3 + channel];
            out[channel * 4 + 2] = L2_PACK_1 * sh[2 * 3 + channel];
            out[channel * 4 + 3] = L2_PACK_0 * sh[0 * 3 + channel] - L2_PACK_3 * sh[6 * 3 + channel];
        }

        for (let channel = 0; channel < 3; channel++)
        {
            const base = (channel + 3) * 4;

            out[base] = L2_PACK_2 * sh[4 * 3 + channel];
            out[base + 1] = -L2_PACK_2 * sh[5 * 3 + channel];
            out[base + 2] = 3 * L2_PACK_3 * sh[6 * 3 + channel];
            out[base + 3] = -L2_PACK_2 * sh[7 * 3 + channel];
        }

        out[24] = L2_PACK_4 * sh[8 * 3];
        out[25] = L2_PACK_4 * sh[8 * 3 + 1];
        out[26] = L2_PACK_4 * sh[8 * 3 + 2];
        out[27] = 1;

        return out;
    }

    /**
     * Scratch
     * @type {{ direction: vec3 }}
     */
    static global = {
        direction: vec3.create()
    };

}
