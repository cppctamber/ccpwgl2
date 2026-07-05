/**
 * CewgLightCuller
 *
 * Contribution-based CPU light culler for the CEWG tiled-forward light
 * list (see `CewgLightList`). Given the full scene light array and a
 * bounding sphere (typically the camera frustum's bounding sphere, or an
 * object's world bounds), returns a small set of 1-based Buffer B indices
 * ready to hand to `CewgLightList#WriteDrawList`.
 *
 * "Contribution" here is a cheap `radius^2 / distance^2` falloff proxy -
 * it is not a physically exact attenuation model, just a stable ordering
 * heuristic so the closest/largest lights survive truncation to
 * `maxCount`. Lights whose sphere (position, radius) does not intersect
 * the given bounding sphere are excluded outright.
 *
 * This module is pure typed-array/math logic - no GL, no ccpwgl
 * "utils"/"global" aliases - so it can run directly under plain node.
 */
class CewgLightCuller
{

    /**
     * Culls and ranks a light array against a bounding sphere
     *
     * Lights are expected in the same order passed to
     * `CewgLightList#SetLights` (a plain 0-based array); the returned
     * indices are 1-based Buffer B indices (`arrayIndex + 1`), which is
     * exactly the indexing `CewgLightList#WriteDrawList` expects.
     *
     * @param {Array<{position:number[], radius:number}>} lights source light array (0-based, same order as SetLights)
     * @param {number[]} center [x, y, z] bounding sphere centre to cull against
     * @param {number} boundingRadius bounding sphere radius to cull against
     * @param {number} [maxCount] optional cap on the number of returned indices
     * @returns {number[]} 1-based light indices, sorted by descending contribution
     */
    static Cull(lights, center, boundingRadius, maxCount)
    {
        const candidates = [];

        for (let i = 0; i < lights.length; i++)
        {
            const light = lights[i];
            const position = light.position || [ 0, 0, 0 ];
            const radius = light.radius || 0;

            const dx = position[0] - center[0];
            const dy = position[1] - center[1];
            const dz = position[2] - center[2];
            const distanceSq = dx * dx + dy * dy + dz * dz;

            // Sphere/sphere intersection test against the caller's bounds.
            const reach = radius + boundingRadius;
            if (distanceSq > reach * reach)
            {
                continue;
            }

            // Guard against divide-by-zero when a light sits on the centre.
            const safeDistanceSq = distanceSq > 1e-6 ? distanceSq : 1e-6;
            const contribution = (radius * radius) / safeDistanceSq;

            candidates.push({ index: i + 1, contribution });
        }

        candidates.sort((a, b) => b.contribution - a.contribution);

        const limit = typeof maxCount === "number"
            ? Math.min(maxCount, candidates.length)
            : candidates.length;

        const result = new Array(limit);
        for (let i = 0; i < limit; i++)
        {
            result[i] = candidates[i].index;
        }
        return result;
    }

}

module.exports = { CewgLightCuller };
