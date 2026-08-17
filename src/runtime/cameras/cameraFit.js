/**
 * Camera fitting arithmetic, with no engine in it.
 *
 * Nothing here imports anything, which is the point: a fit is trigonometry over
 * four numbers, and the reason the existing fit is wrong is that it was written
 * where an engine could be reached for and the arithmetic could not be checked
 * by hand.
 *
 * ## `fov` is the VERTICAL field of view, in degrees
 *
 * Stated because the codebase disagrees with itself about it, and the
 * disagreement is the source of the bug this module replaces. The authority is
 * the projection, which is built the same way in the wrapped camera and in the
 * `TnyCameraTest` fallback:
 *
 *     fH = tan(fov / 360 * PI) * nearPlane      // half-extent, bottom..top
 *     fW = fH * aspect                          // half-extent, left..right
 *     mat4.frustum(out, -fW, fW, -fH, fH, ...)
 *
 * `fov` sets the vertical half-extent and the horizontal one is derived from it,
 * so `fov` is vertical and the horizontal angle *widens* with aspect. The helper
 * this module supersedes is named `getFovFromHorizontalDegrees` and is called
 * with that same vertical `fov`, which is how a fit ends up reasoning about the
 * wrong axis the moment the viewport stops being square.
 *
 * ## Why a sphere rather than a box
 *
 * A fit has to hold at whatever angle the camera happens to be at, and a camera
 * does not tell the fitter which way it is looking. A bounding sphere is the
 * only bound that is orientation-independent, so fitting the sphere is the only
 * fit that cannot be broken by a yaw.
 *
 * The measured alternative: the previous fit read the object's local AABB width
 * (x) and height (y) and picked one of them, never considering length (z). A
 * ship's long dimension *is* z, so a side-on view — the one every ship database
 * uses — put the longest axis across the screen and fitted for one of the two
 * short ones. Measured against three hulls at build 3470007, that under-fits by
 * between 1.4x and 4.0x, varying per hull because it varies with the hull's own
 * proportions:
 *
 * | hull | AABB x, y, z | sphere diameter | old fit | sphere fit | under-fit |
 * | --- | --- | --- | --- | --- | --- |
 * | `mf4_t1` Rifter | 98, 29, 121 | 158 | 142.8 | 229.4 | 1.61x |
 * | `gc1_t1` | 115, 194, 142 | 267 | 282.1 | 387.7 | 1.37x |
 * | `ab1_t1` Apocalypse | 233, 398, 1529 | 1597 | 578.2 | 2319.0 | 4.01x |
 *
 * A varying error is why no multiplier ever fixed this: a margin generous enough
 * to keep the Apocalypse in frame leaves the other two hulls as specks, and the
 * two complaints look like different problems.
 *
 * A sphere fit is conservative — it reserves room for an extent the hull may not
 * actually have in every direction — which is the right trade for a catalogue,
 * because it makes apparent scale consistent across hulls. A caller wanting a
 * tighter crop lowers the margin rather than reaching for the box.
 */

/** Smallest aspect or fov worth treating as a real value. */
const EPSILON = 1e-9;

/**
 * Both half-angles of a frustum, and which of them binds.
 *
 * The binding half-angle is simply the smaller one: whichever axis runs out of
 * room first is the axis a fit has to satisfy, and satisfying it satisfies the
 * other by construction.
 *
 * @param {Number} fovVerticalDegrees - vertical field of view, 0..180 exclusive
 * @param {Number} [aspect=1] - viewport width divided by height
 * @returns {{vertical: Number, horizontal: Number, binding: Number}} half-angles, radians
 */
export function fovHalfAngles(fovVerticalDegrees, aspect = 1)
{
    if (!Number.isFinite(fovVerticalDegrees) || fovVerticalDegrees <= EPSILON || fovVerticalDegrees >= 180)
    {
        throw new TypeError(`Vertical fov must be a finite value between 0 and 180 degrees, got ${fovVerticalDegrees}`);
    }

    if (!Number.isFinite(aspect) || aspect <= EPSILON)
    {
        throw new TypeError(`Aspect must be a finite positive value, got ${aspect}`);
    }

    const vertical = (fovVerticalDegrees * Math.PI / 180) / 2;
    // The horizontal half-angle is not the vertical one scaled: the frustum is
    // built by scaling the near-plane *half-extent*, so the aspect multiplies
    // the tangent and the angle comes back out through atan.
    const horizontal = Math.atan(Math.tan(vertical) * aspect);

    return { vertical, horizontal, binding: Math.min(vertical, horizontal) };
}

/**
 * The distance at which a sphere exactly fills the tighter axis of the view.
 *
 * A sphere of radius `r` seen from distance `d` subtends a half-angle of
 * `asin(r / d)`, so fitting it inside a half-angle `t` needs
 * `asin(r / d) <= t`, i.e. `d >= r / sin(t)`. The sine is the whole content of
 * this function and is the part worth checking by hand: the frustum plane is
 * *tangent* to the sphere, and a tangent length is a sine rather than a tangent.
 *
 * Using `tan` here instead — which is what fitting a flat object of width `2r`
 * would call for — puts the camera slightly too close and clips the sphere's
 * silhouette at the edges. It is a small error and it is always in the wrong
 * direction, so it is spelled out rather than absorbed into the margin.
 *
 * @param {Object} options
 * @param {Number} options.radius - bounding sphere radius, world units, > 0
 * @param {Number} options.fovVerticalDegrees - vertical field of view, degrees
 * @param {Number} [options.aspect=1] - viewport width divided by height
 * @param {Number} [options.margin=1] - 1 fills the view exactly; 1.2 leaves a fifth
 * @returns {Number} distance from the sphere's centre, world units
 */
export function distanceToFitSphere({ radius, fovVerticalDegrees, aspect = 1, margin = 1 } = {})
{
    // Deliberately a throw rather than a fallback. A bound of zero means the
    // caller has no idea how big the subject is, and the honest answers are "ask
    // the caller for a distance" or "fail" — never a plausible-looking number,
    // which is the failure this module exists to stop producing.
    if (!Number.isFinite(radius) || radius <= 0)
    {
        throw new TypeError(`Fit radius must be a finite positive value, got ${radius}`);
    }

    if (!Number.isFinite(margin) || margin <= 0)
    {
        throw new TypeError(`Fit margin must be a finite positive value, got ${margin}`);
    }

    const { binding } = fovHalfAngles(fovVerticalDegrees, aspect);

    return (radius / Math.sin(binding)) * margin;
}

/**
 * A bounding radius for a caller that only has an axis-aligned box.
 *
 * Half the diagonal, because that is the radius that holds at every orientation
 * — half the longest edge is only enough when the box is viewed square-on down
 * one of its own axes.
 *
 * @param {Number[]|Float32Array} size - box extents, [x, y, z]
 * @returns {Number} radius, world units
 */
export function boundingRadiusFromSize(size)
{
    if (!size || size.length < 3)
    {
        throw new TypeError("Box size must be a three component vector");
    }

    const x = Number(size[0]);
    const y = Number(size[1]);
    const z = Number(size[2]);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
    {
        throw new TypeError(`Box size must be finite, got ${Array.from(size).join(", ")}`);
    }

    return Math.sqrt(x * x + y * y + z * z) / 2;
}

/**
 * The fraction of the frame's tighter axis a sphere occupies at a distance.
 *
 * The inverse of `distanceToFitSphere`, and the reason it is here is testing: a
 * fit is only checkable if the thing it claims can be measured back out of it.
 * `distanceToFitSphere` with margin `m` must round-trip to `1 / m`.
 *
 * @param {Object} options
 * @param {Number} options.radius
 * @param {Number} options.distance
 * @param {Number} options.fovVerticalDegrees
 * @param {Number} [options.aspect=1]
 * @returns {Number} 1 when the sphere exactly fills the tighter axis
 */
export function sphereViewFraction({ radius, distance, fovVerticalDegrees, aspect = 1 } = {})
{
    if (!Number.isFinite(distance) || distance <= 0)
    {
        throw new TypeError(`Distance must be a finite positive value, got ${distance}`);
    }

    if (!Number.isFinite(radius) || radius <= 0)
    {
        throw new TypeError(`Radius must be a finite positive value, got ${radius}`);
    }

    const { binding } = fovHalfAngles(fovVerticalDegrees, aspect);

    return (radius / distance) / Math.sin(binding);
}
