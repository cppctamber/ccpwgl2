const { CewgLightList } = require("./CewgLightList");

/**
 * CewgLightCollector
 *
 * Frame-scoped light collection + CPU cull feeding a `CewgLightList` for
 * ccpwgl's CEWG (translated DX11) shader path. Scene-owned light owners
 * (see the `GetLights(collector, parentContext)` hooks added to
 * EveChildContainer / EveEffectRoot2 / EveStretch) push already-composed
 * light rows (the `{position, radius, color, flags, params}` shape
 * `Tr2PointLight#GetCewgLightData` produces - see
 * src/unsupported/core/lighting/Tr2PointLight.js) into this collector via
 * `Collect()`; once every owner has been visited for the frame, `Resolve()`
 * runs the CPU cull and writes the survivors into the owned `CewgLightList`
 * (`SetLights` + `WriteDrawList`), ready for `CewgResourceBinder.SetLightList`.
 *
 * CPU CULL (ported from carbonengine trinity/trinity/Lights/Tr2LightManager.cpp,
 * `Tr2LightManager::AddLight`, lines 334-368 per the prior source survey):
 *   1. Reject if radius <= 0. This module receives already-composed rows
 *      (not raw brightness), so the "brightness <= 0" half of Carbon's test
 *      is represented here by the CEWG_FLAG_ENABLED bit
 *      (src/unsupported/core/lighting/CewgLightMath.js) being unset -
 *      `Tr2PointLight#GetCewgLightData` clears that bit whenever
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
 *   4. Optionally (see `premultiplyRadiusIntoColor` below) `color *=
 *      radius` before the row is written.
 *
 * PREMULTIPLY OPTION - the source survey flagged that Carbon's
 * `Tr2LightManager::AddLight` appears to do `color *= radius * dimming`
 * before handing the row to the shader-visible light buffer, but whether
 * the CEWG shader contract (reverse engineered independently in
 * CewgLightList.js from shipped DX11 bytecode) expects radius
 * premultiplied into color, or expects raw color with radius carried
 * separately (as CewgLightList's Buffer B layout does, in `row0.w`), is
 * NOT verified. `premultiplyRadiusIntoColor` therefore defaults OFF; only
 * the (verified-safe) fade dimming multiply is always applied. Flip it on
 * only after confirming the shader-side expectation.
 *
 * Pure typed-array/math logic - no GL calls, no ccpwgl "utils"/"global"
 * aliases - so this runs directly under plain node (see
 * scripts/test-cewg-light-collector.js) as well as under webpack.
 */
class CewgLightCollector
{

    /**
     * Constructs a CewgLightCollector
     * @param {object} [options]
     * @param {object} [options.lightList] forwarded to `new CewgLightList(...)`
     * @param {boolean} [options.premultiplyRadiusIntoColor=false] see class doc - defaults OFF (unverified)
     */
    constructor(options = {})
    {
        this._lightList = new CewgLightList(options.lightList || {});
        this._rows = [];
        this.premultiplyRadiusIntoColor = options.premultiplyRadiusIntoColor === true;
    }

    /**
     * Gets the owned CewgLightList (for SetScreenSize / handing to CewgResourceBinder.SetLightList)
     * @returns {CewgLightList}
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
     * Appends collected light rows for the current frame
     * @param {Array<{position:number[], radius:number, color:number[], flags:number, params:number[]}>} lightRows
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
     * writes the survivors into the owned CewgLightList (`SetLights` +
     * `WriteDrawList`). Does NOT call `SetScreenSize` - the light list's
     * screen size / tile layout is a separate concern owned by the caller
     * (e.g. once per resize), since this method has no viewport width, only
     * a height (needed for the pixel-size cutoff projection).
     * @param {object} [options]
     * @param {Array<number[]>} [options.frustumPlanes] view frustum planes, each `[a, b, c, d]` with the convention `a*x + b*y + c*z + d >= 0` meaning "in front of / inside" the plane. Omit (or pass `[]`) to skip frustum culling entirely.
     * @param {number} [options.viewportHeight=0] viewport height in pixels, used by the pixel-size cutoff. If <= 0, the cutoff never rejects (pixel size cannot be computed).
     * @param {number} [options.fovY=0] vertical field of view in radians, used by the pixel-size cutoff. If <= 0, the cutoff never rejects.
     * @param {number[]} [options.cameraPosition=[0,0,0]] world-space camera position, used by both the pixel-size cutoff and the contribution sort.
     * @param {number} [options.maxLights] cap on the number of surviving lights (defaults to the owned CewgLightList's capacity; always clamped to it).
     * @param {number} [options.cutoffPixelSize=CewgLightCollector.CUTOFF_PIXEL_SIZE] pixel-size cutoff override (e.g. to scale by LOD).
     * @param {number} [options.fadeBandPixels=CewgLightCollector.FADE_BAND_PIXELS] fade-band override (e.g. to scale by LOD).
     * @returns {{collectedCount:number, culledCount:number, lightCount:number}}
     */
    Resolve(options = {})
    {
        const frustumPlanes = options.frustumPlanes || [];
        const viewportHeight = options.viewportHeight || 0;
        const fovY = options.fovY || 0;
        const cameraPosition = options.cameraPosition || [ 0, 0, 0 ];
        const cutoffPixelSize = typeof options.cutoffPixelSize === "number"
            ? options.cutoffPixelSize : CewgLightCollector.CUTOFF_PIXEL_SIZE;
        const fadeBandPixels = typeof options.fadeBandPixels === "number"
            ? options.fadeBandPixels : CewgLightCollector.FADE_BAND_PIXELS;
        const maxLights = typeof options.maxLights === "number"
            ? Math.min(options.maxLights, this._lightList.maxLights)
            : this._lightList.maxLights;

        const collectedCount = this._rows.length;
        const candidates = [];

        for (let i = 0; i < collectedCount; i++)
        {
            const row = this._rows[i];
            const radius = row.radius || 0;
            const flags = (row.flags || 0) >>> 0;

            // Step 1: brightness<=0 (unset enabled bit) / radius<=0.
            if (radius <= 0) continue;
            if (!(flags & CewgLightCollector.FLAG_ENABLED)) continue;

            const position = row.position || [ 0, 0, 0 ];

            // Step 2: frustum sphere test.
            if (CewgLightCollector.FrustumRejectsSphere(frustumPlanes, position, radius)) continue;

            // Step 3: pixel-size cutoff + fade dimming.
            const dx = position[0] - cameraPosition[0];
            const dy = position[1] - cameraPosition[1];
            const dz = position[2] - cameraPosition[2];
            const distanceSq = dx * dx + dy * dy + dz * dz;
            const distance = Math.sqrt(distanceSq);

            const pixelSize = CewgLightCollector.ComputePixelSize(radius, distance, viewportHeight, fovY);
            const dimming = CewgLightCollector.ComputeSizeDimming(pixelSize, cutoffPixelSize, fadeBandPixels);
            if (dimming <= 0) continue;

            const color = row.color || [ 0, 0, 0 ];
            let r = color[0] * dimming;
            let g = color[1] * dimming;
            let b = color[2] * dimming;

            // Step 4: optional (default OFF) radius premultiply - see class doc.
            if (this.premultiplyRadiusIntoColor)
            {
                r *= radius;
                g *= radius;
                b *= radius;
            }

            // Contribution heuristic reused from CewgLightCuller (radius^2 / distance^2
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
        if (pixelSize >= cutoff) return 1;

        if (fadeBand <= 0) return 0;

        const fadeStart = cutoff - fadeBand;
        if (pixelSize <= fadeStart) return 0;

        return (pixelSize - fadeStart) / fadeBand;
    }

}

/** Raw uint32 bit pattern mirroring CewgLightMath.CEWG_FLAG_ENABLED (0x10000) - duplicated here (not imported) so this module stays a framework-free CJS module runnable under plain node; see src/unsupported/core/lighting/CewgLightMath.js for the ES-module original. */
CewgLightCollector.FLAG_ENABLED = 0x10000;

/** Default pixel-size cutoff (Carbon: `CUTOFF_PIXEL_SIZE`, Tr2LightManager.cpp) */
CewgLightCollector.CUTOFF_PIXEL_SIZE = 7;

/** Default fade band width below the cutoff, in pixels */
CewgLightCollector.FADE_BAND_PIXELS = 5;

module.exports = { CewgLightCollector };
