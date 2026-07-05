import { meta } from "utils";
import { vec3, vec4 } from "math";


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
@meta.notImplemented
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

        for (let i = 0; i < this._sources.length; i++)
        {
            const source = this._sources[i];
            if (source.radius > 0)
            {
                data.push({
                    position: [ source.position[0], source.position[1], source.position[2] ],
                    radius: source.radius,
                    albedo: [
                        source.albedo[0] * this.secondaryIntensity,
                        source.albedo[1] * this.secondaryIntensity,
                        source.albedo[2] * this.secondaryIntensity
                    ],
                    cutoffMultiplier: 1,
                    emissive: [
                        source.emissive[0] * this.secondaryIntensity,
                        source.emissive[1] * this.secondaryIntensity,
                        source.emissive[2] * this.secondaryIntensity
                    ]
                });
            }
        }

        for (let i = 0; i < this.lights.length; i++)
        {
            const light = this.lights[i];
            if (typeof light.GetLight !== "function") continue;
            const { position, radius, color } = light.GetLight();

            data.push({
                position: [ position[0], position[1], position[2] ],
                radius,
                albedo: [ 0, 0, 0 ],
                cutoffMultiplier: 0,
                emissive: [
                    color[0] * this.primaryIntensity,
                    color[1] * this.primaryIntensity,
                    color[2] * this.primaryIntensity
                ]
            });
        }

        this._sourceData = data;
    }

    /**
     * Evaluates SH lighting coefficients for a sample position
     *
     * TODO: NOT implemented. Carbon's `GetLighting`/`CalculateSecondaryLighting`
     * (Tr2ShLightingManager.cpp:306-383) evaluate per-source spherical-cap
     * SH basis coefficients (`ShSolver<L1>`/`ShSolver<L2>`,
     * Tr2ShLightingManager.cpp:16-219) and pack them into
     * `PACKED_COEFFICIENT_COUNT` Vector4s. That math itself is textually
     * available and could be transcribed, but the per-source cutoff test
     * it depends on (Tr2ShLightingManager.cpp:332-341) branches on the
     * *fourth (padding) SIMD lane* of a `Vector3` value loaded as a
     * 4-wide `XMFLOAT4A` (`source->position`/`source->emissive`, both
     * declared as `Vector3` in `SourceData`, Tr2ShLightingManager.h:61-69) -
     * i.e. it reads whatever garbage float happens to occupy that padding
     * lane. That is not safely portable (there is no equivalent "padding
     * lane" concept in JS, and replicating it would mean inventing
     * behavior, not porting it) - flagging this rather than guessing.
     * Until this is resolved, this returns an all-zero coefficient array of
     * the correct shape.
     * @param {Number[]} position
     * @param {Number} intensity
     * @param {Number} cutoffRadius
     * @returns {vec4[]} `PACKED_COEFFICIENT_COUNT` (7) zero-filled Vector4s
     */
    GetLighting(position, intensity, cutoffRadius)
    {
        const result = new Array(Tr2ShLightingManager.PACKED_COEFFICIENT_COUNT);
        for (let i = 0; i < result.length; i++) result[i] = vec4.create();
        return result;
    }

}
