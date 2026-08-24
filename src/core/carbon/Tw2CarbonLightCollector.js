const { Tw2CarbonLightList } = require("./Tw2CarbonLightList");

/**
 * Tw2CarbonLightCollector
 *
 * Frame-scoped light collection + CPU cull feeding a `Tw2CarbonLightList` for
 * ccpwgl's Carbon (translated DX11) shader path. Scene-owned light owners
 * (see the `GetLights(collector, parentContext)` hooks added to
 * EveChildContainer / EveEffectRoot2 / EveStretch) push already-composed
 * light rows (the `{position, radius, color, flags, innerRadius?, params}` shape
 * `Tr2PointLight#GetCarbonLightData` produces - see
 * src/core/lighting/Tr2PointLight.js) into this collector via
 * `Collect()`; once every owner has been visited for the frame, `Resolve()`
 * runs the CPU cull and writes the survivors into the owned `Tw2CarbonLightList`
 * (`SetLights` + `WriteDrawList`), ready for `Tw2CarbonResourceBinder.SetLightList`.
 *
 * CPU CULL (ported from carbonengine trinity/trinity/Lights/Tr2LightManager.cpp,
 * `Tr2LightManager::AddLight`, lines 334-368 per the prior source survey):
 *   1. Reject if radius <= 0. This module receives already-composed rows
 *      (not raw brightness), so the "brightness <= 0" half of Carbon's test
 *      is represented here by the Carbon_FLAG_AFFECTS_SURFACES bit (Carbon FLAG_AFFECTS_SURFACES)
 *      (src/core/lighting/Tw2CarbonLightMath.js) being unset -
 *      `Tr2PointLight#GetCarbonLightData` clears that bit whenever
 *      `radius <= 0 || composedBrightness <= 0`. Rows missing the bit are
 *      rejected here too, so both halves of Carbon's original test are
 *      covered even though this module never sees raw brightness.
 *   2. Reject if the light's bounding sphere (position, radius) does not
 *      intersect the view frustum (`FrustumRejectsSphere`).
 *   3. Screen-size cutoff: project the light's sphere to a pixel size
 *      (`ComputePixelSize`) and look up a [0,1] dimming factor
 *      (`ComputeSizeDimming`) against `CUTOFF_PIXEL_SIZE` (7px) with a
 *      `FADE_BAND_PIXELS` (5px) fade band below it - lights smaller than
 *      `CUTOFF_PIXEL_SIZE - FADE_BAND_PIXELS` (2px) are rejected outright;
 *      lights in the fade band have `color` scaled by the fractional
 *      dimming factor; lights at/above the cutoff are unaffected (dimming
 *      1). Both thresholds accept overrides via `Resolve()` options so a
 *      caller can scale them by LOD, matching the "fade band scaled by
 *      LOD" note from the source survey.
 *   4. `color *= radius` before the row is written - see below.
 *
 * PREMULTIPLY - VERIFIED, and ON. Carbon does this, in one expression with
 * the dimming (`Tr2LightManager.cpp:342-346`):
 *
 *     float dimming = std::min( ( size - m_adjustedCutoff ) / FADE_SIZE, 1.f );
 *     data.color.x *= data.radius * dimming;
 *
 * It defaulted OFF while unverified, on the worry that Buffer B carries
 * radius separately in `row0.w` and the shader might apply it itself. It
 * does not - and radius appearing in the row is not evidence either way,
 * because the shader needs it for ATTENUATION regardless of how the colour
 * was scaled.
 *
 * What settles it is who reads the buffer: this list is consumed only by
 * translated DX11 shaders, which are Carbon's own shaders. They are fed
 * premultiplied colour by Carbon, so they expect premultiplied colour from
 * us. (The legacy v8 path never samples the light-list textures at all.)
 *
 * The symptom while it was off is worth recognising again: every light was
 * too dim by a factor of its own radius, so the error grew with the light.
 * A small light looked plausible and a large one looked broken, which reads
 * like a falloff or exposure problem rather than a missing multiply.
 *
 * Pure typed-array/math logic - no GL calls, no ccpwgl "utils"/"global"
 * aliases - so this runs directly under plain node (see
 * scripts/test-carbon-light-collector.js) as well as under webpack.
 */
class Tw2CarbonLightCollector
{

    /**
     * Constructs a Tw2CarbonLightCollector
     * @param {object} [options]
     * @param {object} [options.lightList] forwarded to `new Tw2CarbonLightList(...)`
     * @param {boolean} [options.premultiplyRadiusIntoColor=true] see class doc - Carbon does this, so leave it on
     */
    constructor(options = {})
    {
        this._lightList = new Tw2CarbonLightList(options.lightList || {});
        this._rows = [];
        this.premultiplyRadiusIntoColor = options.premultiplyRadiusIntoColor !== false;
    }

    /**
     * Gets the owned Tw2CarbonLightList (for SetScreenSize / handing to Tw2CarbonResourceBinder.SetLightList)
     * @returns {Tw2CarbonLightList}
     */
    GetLightList()
    {
        return this._lightList;
    }

    /**
     * Clears the frame's collected rows (call once at the start of each frame, before any GetLights hooks run)
     */
    Reset()
    {
        this._rows.length = 0;
    }

    /**
     * Appends ONE light, by value - Carbon's spelling.
     *
     * `Tr2LightManager::AddLight( PerLightData& data )` takes its row by value
     * and the culling happens inside it. Here the culling is deferred to
     * Resolve, which does the same work over the whole frame's rows, so this is
     * the gathering half only.
     *
     * THE COPY IS THE POINT. A producer that emits many lights from one
     * placement loop reuses a single scratch record - EveSmartLightPointLight
     * does exactly that - and Collect stores the reference it is handed, so a
     * shared scratch would leave every collected light as a copy of the last
     * one. Carbon is immune because C++ copies on the call; this method makes
     * that explicit. EvePlaneSet works around it the other way, by allocating a
     * fresh record per light.
     *
     * This method existing is also what connects the two light contracts in
     * this codebase. The smart-light classes were ported against Carbon's
     * `GetLights(lightManager)` + `AddLight` shape and called
     * `lightManager?.AddLight?.(record)` - optional chaining on the METHOD, so
     * against a collector that had no AddLight, every smart light silently went
     * nowhere and nothing reported it.
     *
     * @param {Object} light - a PerLightData-shaped record; see Collect
     * @returns {Object|null} the stored copy, or null if there was nothing to store
     */
    AddLight(light)
    {
        if (!light) return null;

        const position = light.position || [ 0, 0, 0 ];
        const color = light.color || [ 0, 0, 0 ];
        const direction = light.direction;

        const row = {
            position: [ position[0], position[1], position[2] ],
            color: [ color[0], color[1], color[2] ],
            radius: light.radius || 0,
            innerRadius: light.innerRadius,
            flags: light.flags || 0,
            direction: direction ? [ direction[0], direction[1], direction[2] ] : undefined,
            projectionPlaneDistance: light.projectionPlaneDistance,
            outerAngle: light.outerAngle,
            innerAngle: light.innerAngle,
            params: light.params ? light.params.slice() : undefined
        };

        this._rows.push(row);
        return row;
    }

    /**
     * Appends collected light rows for the current frame
     * @param {Array<{position:number[], radius:number, color:number[], flags:number, innerRadius?:number, params:number[]}>} lightRows
     */
    Collect(lightRows)
    {
        if (!lightRows) return;
        for (let i = 0; i < lightRows.length; i++)
        {
            if (lightRows[i]) this._rows.push(lightRows[i]);
        }
    }

    /**
     * Gets the number of rows collected since the last Reset (before culling)
     * @returns {number}
     */
    GetCollectedCount()
    {
        return this._rows.length;
    }

    /**
     * Runs the CPU cull over every row collected since the last `Reset()` and
     * writes the survivors into the owned Tw2CarbonLightList (`SetLights` +
     * `WriteDrawList`). Does NOT call `SetScreenSize` - the light list's
     * screen size / tile layout is a separate concern owned by the caller
     * (e.g. once per resize), since this method has no viewport width, only
     * a height (needed for the pixel-size cutoff projection).
     * @param {object} [options]
     * @param {Array<number[]>} [options.frustumPlanes] view frustum planes, each `[a, b, c, d]` with the convention `a*x + b*y + c*z + d >= 0` meaning "in front of / inside" the plane. Omit (or pass `[]`) to skip frustum culling entirely.
     * @param {number} [options.viewportHeight=0] viewport height in pixels, used by the pixel-size cutoff. If <= 0, the cutoff never rejects (pixel size cannot be computed).
     * @param {number} [options.fovY=0] vertical field of view in radians, used by the pixel-size cutoff. If <= 0, the cutoff never rejects.
     * @param {number[]} [options.cameraPosition=[0,0,0]] world-space camera position, used by both the pixel-size cutoff and the contribution sort.
     * @param {{GetPixelSizeAcross:Function}} [options.frustum] measures apparent size the way Carbon does - see below. Duck typed, so this module stays dependency free.
     * @param {Number} [options.brightness=1] blanket multiplier on every surviving light's colour - see tw2.localLightBrightness. Passed in rather than read, so this module stays runnable under plain node.
     * @param {number} [options.maxLights] cap on the number of surviving lights (defaults to the owned Tw2CarbonLightList's capacity; always clamped to it).
     * @param {number} [options.cutoffPixelSize=Tw2CarbonLightCollector.CUTOFF_PIXEL_SIZE] pixel-size cutoff override (e.g. to scale by LOD).
     * @param {number} [options.fadeBandPixels=Tw2CarbonLightCollector.FADE_BAND_PIXELS] fade-band override (e.g. to scale by LOD).
     * @returns {{collectedCount:number, culledCount:number, lightCount:number}}
     */
    Resolve(options = {})
    {
        const frustumPlanes = options.frustumPlanes || [];
        const viewportHeight = options.viewportHeight || 0;
        const fovY = options.fovY || 0;
        const cameraPosition = options.cameraPosition || [ 0, 0, 0 ];

        // A blanket colour multiplier, applied last. Non-Carbon: see
        // tw2.localLightBrightness for why it exists and why a value other than
        // 1 is a debt rather than a setting. Guarded so a null or a negative
        // cannot quietly blank the scene.
        const brightness = typeof options.brightness === "number" && options.brightness >= 0
            ? options.brightness
            : 1;

        // Carbon measures apparent size along the VIEW DIRECTION
        // (TriFrustum::GetPixelSizeAccross: `depth = dot( viewDir, viewPos -
        // center )`), not by straight-line distance. The two agree only at the
        // centre of the screen; off to the side, distance exceeds depth and a
        // light reads smaller than Carbon thinks it is - which now decides
        // whether it is culled at all, since anything at or below the cutoff is
        // dropped outright.
        //
        // Carbon has BOTH: GetPixelSizeAccrossEst uses distance, and is what
        // the local-light fallback below amounts to. AddLight uses the depth
        // one, so a caller that can supply a frustum should.
        const frustum = options.frustum && typeof options.frustum.GetPixelSizeAcross === "function"
            ? options.frustum
            : null;
        const cutoffPixelSize = typeof options.cutoffPixelSize === "number"
            ? options.cutoffPixelSize : Tw2CarbonLightCollector.CUTOFF_PIXEL_SIZE;
        const fadeBandPixels = typeof options.fadeBandPixels === "number"
            ? options.fadeBandPixels : Tw2CarbonLightCollector.FADE_BAND_PIXELS;
        const maxLights = typeof options.maxLights === "number"
            ? Math.min(options.maxLights, this._lightList.maxLights)
            : this._lightList.maxLights;

        const collectedCount = this._rows.length;
        const candidates = [];

        for (let i = 0; i < collectedCount; i++)
        {
            const row = this._rows[i];
            const radius = row.radius || 0;
            const flags = Tw2CarbonLightCollector.NormalizeFlags(row.flags);

            // Step 1: radius<=0, and a light that affects nothing.
            if (radius <= 0) continue;
            if (!Tw2CarbonLightCollector.AreLightFlagsValid(flags)) continue;

            const position = row.position || [ 0, 0, 0 ];

            // Step 2: frustum sphere test.
            if (Tw2CarbonLightCollector.FrustumRejectsSphere(frustumPlanes, position, radius)) continue;

            // Step 3: pixel-size cutoff + fade dimming.
            const dx = position[0] - cameraPosition[0];
            const dy = position[1] - cameraPosition[1];
            const dz = position[2] - cameraPosition[2];
            const distanceSq = dx * dx + dy * dy + dz * dz;
            const distance = Math.sqrt(distanceSq);

            const pixelSize = frustum
                ? frustum.GetPixelSizeAcross(position, radius)
                : Tw2CarbonLightCollector.ComputePixelSize(radius, distance, viewportHeight, fovY);
            const dimming = Tw2CarbonLightCollector.ComputeSizeDimming(pixelSize, cutoffPixelSize, fadeBandPixels);
            if (dimming <= 0) continue;

            const color = row.color || [ 0, 0, 0 ];
            let r = color[0] * dimming;
            let g = color[1] * dimming;
            let b = color[2] * dimming;

            // Step 4: radius premultiply. Carbon folds this into the same
            // expression as the dimming - `color *= radius * dimming` - and
            // without it a light is too dim by a factor of its own radius.
            if (this.premultiplyRadiusIntoColor)
            {
                r *= radius;
                g *= radius;
                b *= radius;
            }

            if (brightness !== 1)
            {
                r *= brightness;
                g *= brightness;
                b *= brightness;
            }

            // Contribution heuristic reused from Tw2CarbonLightCuller (radius^2 / distance^2
            // falloff proxy) purely to rank survivors when `maxLights` truncates.
            const safeDistanceSq = distanceSq > 1e-6 ? distanceSq : 1e-6;
            const contribution = (radius * radius) / safeDistanceSq;

            candidates.push({
                contribution,
                light: {
                    position: [ position[0], position[1], position[2] ],
                    radius,
                    color: [ r, g, b ],
                    flags,

                    // INNER RADIUS, which is where the falloff comes from - it is the
                    // distance the light is at full strength before it begins to fall
                    // away, and at zero a light has no ramp at all.
                    //
                    // Two row shapes reach this collector and they spell it
                    // differently: Tr2PointLight.GetCarbonLightData passes it as
                    // `params[0]`, while lightConversion.CreateLightRecord - which is
                    // what EvePlaneSet and every attachment light use - carries a
                    // top-level `innerRadius` and no `params` at all.
                    //
                    // Only `params` used to be forwarded, so the second shape lost it
                    // here, silently: Tw2CarbonLightList.SetLight falls back to
                    // `params[0]`, which was 0, and packed a zero inner radius for
                    // every light. Nothing downstream can tell an authored zero from a
                    // dropped value.
                    innerRadius: row.innerRadius !== undefined
                        ? row.innerRadius
                        : (row.params ? row.params[0] : 0),

                    // The light's AXIS and cone, which are Carbon's third texel.
                    // Same trap as innerRadius one texel up: lightConversion
                    // computes all three and they were dropped here, so a spot
                    // light reached the shader with no cone at all. Undefined is
                    // preserved as undefined rather than defaulted, so the list
                    // applies Carbon's own defaults in one place.
                    direction: row.direction ? [ row.direction[0], row.direction[1], row.direction[2] ] : undefined,
                    projectionPlaneDistance: row.projectionPlaneDistance,
                    outerAngle: row.outerAngle,
                    innerAngle: row.innerAngle,

                    params: row.params ? row.params.slice() : [ 0, 0, 0, 0 ]
                }
            });
        }

        candidates.sort((a, b) => b.contribution - a.contribution);

        const survivors = new Array(Math.min(maxLights, candidates.length));
        for (let i = 0; i < survivors.length; i++) survivors[i] = candidates[i].light;

        this._lightList.SetLights(survivors);

        const indices = new Array(survivors.length);
        for (let i = 0; i < survivors.length; i++) indices[i] = i + 1;
        this._lightList.WriteDrawList(indices);

        return {
            collectedCount,
            culledCount: collectedCount - survivors.length,
            lightCount: survivors.length
        };
    }

    /**
     * Tests whether a bounding sphere is fully outside at least one of the given planes
     *
     * Plane convention: `[a, b, c, d]` with `a*x + b*y + c*z + d >= 0` meaning
     * "in front of / inside" the plane (this module's own choice - not
     * verified against a specific Carbon frustum-plane packing; callers
     * must supply planes using this convention). A sphere is rejected
     * (fully outside) if, for any plane, `signedDistance < -radius`.
     * @param {Array<number[]>} planes array of `[a, b, c, d]` planes
     * @param {number[]} center `[x, y, z]` sphere centre
     * @param {number} radius sphere radius
     * @returns {boolean} true if the sphere is fully outside at least one plane
     */
    static FrustumRejectsSphere(planes, center, radius)
    {
        for (let i = 0; i < planes.length; i++)
        {
            const p = planes[i];
            const signedDistance = p[0] * center[0] + p[1] * center[1] + p[2] * center[2] + p[3];
            if (signedDistance < -radius) return true;
        }
        return false;
    }

    /**
     * Projects a sphere's radius to an apparent on-screen diameter, in pixels
     *
     * Standard perspective-projection size estimate: at `distance` along the
     * view axis, one world unit spans `viewportHeight / (2 * tan(fovY/2) *
     * distance)` pixels, so a sphere of `radius` spans twice that times
     * `radius` (diameter, not just the projected radius). Returns
     * `Infinity` (never culled by size) if `distance`, `viewportHeight` or
     * `fovY` are non-positive / degenerate (e.g. camera coincident with the
     * light, or the cutoff not configured).
     * @param {number} radius
     * @param {number} distance distance from the camera to the light's centre
     * @param {number} viewportHeight viewport height in pixels
     * @param {number} fovY vertical field of view, in radians
     * @returns {number} apparent diameter in pixels (or Infinity)
     */
    static ComputePixelSize(radius, distance, viewportHeight, fovY)
    {
        if (distance <= 1e-6 || viewportHeight <= 0 || fovY <= 0) return Infinity;

        const halfFovTan = Math.tan(fovY / 2);
        if (halfFovTan <= 0) return Infinity;

        return (radius * viewportHeight) / (halfFovTan * distance);
    }

    /**
     * Looks up the [0,1] dimming factor for a projected pixel size against a
     * cutoff with a fade band below it
     *
     * `pixelSize >= cutoff` -> 1 (unaffected). `pixelSize <= cutoff -
     * fadeBand` -> 0 (fully culled - caller should drop the light).
     * Otherwise linearly interpolated across the band.
     * @param {number} pixelSize apparent diameter in pixels (see `ComputePixelSize`)
     * @param {number} cutoff pixel-size cutoff (Carbon: `CUTOFF_PIXEL_SIZE`, 7px)
     * @param {number} fadeBand fade band width below the cutoff (Carbon: 5px)
     * @returns {number} dimming factor in [0, 1]
     */
    static ComputeSizeDimming(pixelSize, cutoff, fadeBand)
    {
        // The fade band sits ABOVE the cutoff, not below it
        // (Tr2LightManager.cpp:340-344):
        //
        //     if( size > m_adjustedCutoff )
        //         dimming = min( ( size - m_adjustedCutoff ) / FADE_SIZE, 1 );
        //
        // so a light is absent at or below the cutoff, appears at zero
        // brightness as it passes it, and reaches full brightness one fade band
        // further up. The two constants read the other way round - "minimal size
        // before it is culled out" and "size for the light to start dimming out"
        // - but the code is what runs: nothing below 7px exists, and 7-12px is
        // the ramp, not the tail of one.
        //
        // This was previously implemented as its mirror image: full brightness
        // from the cutoff up, fading down to nothing between cutoff-fadeBand and
        // the cutoff. That is brighter than Carbon everywhere it differs, and it
        // renders lights Carbon culls outright.
        if (pixelSize <= cutoff) return 0;

        if (fadeBand <= 0) return 1;

        return Math.min((pixelSize - cutoff) / fadeBand, 1);
    }

}

/** Raw uint32 bit pattern mirroring Tw2CarbonLightMath.Carbon_FLAG_AFFECTS_SURFACES (0x10000) - duplicated here (not imported) so this module stays a framework-free CJS module runnable under plain node; see src/core/lighting/Tw2CarbonLightMath.js for the ES-module original. */
Tw2CarbonLightCollector.FLAG_AFFECTS_SURFACES = 0x10000;

/**
 * Brings either flag spelling to the pre-shifted one this module tests.
 *
 * TWO CONVENTIONS EXIST IN THIS CODEBASE, and a light written in the wrong one
 * is not mis-shaded - it is DISCARDED, at the enabled-bit gate, silently:
 *
 *   Tw2CarbonLightMath.Carbon_FLAG_AFFECTS_SURFACES = 0x10000   pre-shifted
 *   Tw2CarbonLightMath.LightDataFlags.AFFECTS_SURFACES = 1      raw Carbon
 *
 * The pre-shifted spelling is where the flags SIT in Carbon's packed word -
 * `innerRadius | flags << 16` - and Tr2PointLight, Tr2SpotLight and
 * Tr2FactionLight all emit it. The raw spelling is Carbon's own
 * Tr2LightManager.h:100-105 value, and is what LightData carries: it is what
 * lightConversion.AsPerPointLightData copies through, so every EvePlaneSet
 * light and every smart light speaks it.
 *
 * Testing only the pre-shifted value therefore threw away that entire second
 * family before it reached the light buffer. Tw2CarbonLightList._writeLight
 * already accepted both; this makes the gate agree with it.
 *
 * The disambiguation is the same one the list uses, and it is safe because
 * Carbon's flags occupy bits 0-15 of a uint16: a value that fits in 16 bits is
 * raw and needs shifting, a larger one is already in place.
 *
 * @param {Number} flags
 * @returns {Number} the pre-shifted form
 */
Tw2CarbonLightCollector.NormalizeFlags = function(flags)
{
    const raw = (flags || 0) >>> 0;
    return raw <= 0xFFFF ? (raw << 16) >>> 0 : raw;
};

/** FLAG_AFFECTS_PARTICLES (Tr2LightManager.h:101), pre-shifted to match. */
Tw2CarbonLightCollector.FLAG_AFFECTS_PARTICLES = 0x20000;

/**
 * Carbon AreLightFlagsValid (Tr2LightManager.cpp:677-680):
 *
 *     return ( flags & ( FLAG_AFFECTS_SURFACES | FLAG_AFFECTS_PARTICLES ) ) != 0;
 *
 * EITHER bit, not just surfaces. A light authored to affect only particles is
 * a legitimate light that contributes nothing to a surface, and testing
 * surfaces alone discarded it before it could reach the buffer.
 *
 * Expects the pre-shifted form - run NormalizeFlags first.
 * @param {Number} flags
 * @returns {Boolean}
 */
Tw2CarbonLightCollector.AreLightFlagsValid = function(flags)
{
    return (flags & (Tw2CarbonLightCollector.FLAG_AFFECTS_SURFACES | Tw2CarbonLightCollector.FLAG_AFFECTS_PARTICLES)) !== 0;
};

/** Default pixel-size cutoff (Carbon: `CUTOFF_PIXEL_SIZE`, Tr2LightManager.cpp) */
Tw2CarbonLightCollector.CUTOFF_PIXEL_SIZE = 7;

/** Default fade band width below the cutoff, in pixels */
Tw2CarbonLightCollector.FADE_BAND_PIXELS = 5;

module.exports = { Tw2CarbonLightCollector };
