/**
 * Regression test: camera fitting arithmetic.
 *
 * Runs with no engine, no canvas and no GL, because the module under test
 * imports nothing — which is the property that makes the maths checkable at all.
 * The previous fit lived where an engine could be reached for, and its error went
 * unnoticed for as long as it did partly because there was nowhere to assert it.
 *
 * The fixtures avoid the two shapes that pass with either right or wrong
 * trigonometry: a square viewport (aspect 1 makes the two half-angles equal, so
 * an axis mix-up is invisible) and a sphere centred on the origin (which hides a
 * centre that is never applied). The real hull numbers are measured values from
 * build 3470007, so a change in behaviour shows up as a changed hull framing
 * rather than only as a changed number.
 */
import assert from "assert";
import {
    fovHalfAngles,
    distanceToFitSphere,
    boundingRadiusFromSize,
    sphereViewFraction
} from "../src/runtime/cameras/cameraFit.js";

let failures = 0;
function check(name, fn)
{
    try { fn(); console.log(`  ok   ${name}`); }
    catch (error) { failures++; console.log(`  FAIL ${name}\n       ${error.message}`); }
}

const close = (actual, expected, tolerance, what) =>
{
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `${what}: expected ${expected} +/- ${tolerance}, got ${actual}`
    );
};

console.log("fovHalfAngles");

check("a square viewport makes both half-angles equal, and either binds", () =>
{
    const { vertical, horizontal, binding } = fovHalfAngles(90, 1);

    // 90 degrees vertical => 45 degree half-angle => tan = 1 => atan(1 * 1) = 45.
    close(vertical, Math.PI / 4, 1e-12, "vertical");
    close(horizontal, Math.PI / 4, 1e-12, "horizontal");
    close(binding, Math.PI / 4, 1e-12, "binding");
});

check("a wide viewport widens the HORIZONTAL angle, so the vertical binds", () =>
{
    const { vertical, horizontal, binding } = fovHalfAngles(90, 16 / 9);

    // atan(tan(45) * 16/9) = atan(1.7778) = 60.642 degrees.
    close(horizontal * 180 / Math.PI, 60.6422, 1e-3, "horizontal degrees");
    assert.ok(horizontal > vertical, "a wide viewport must widen the horizontal angle");
    close(binding, vertical, 1e-12, "the tighter axis of a wide viewport is the vertical one");
});

check("a tall viewport narrows the horizontal angle, so the horizontal binds", () =>
{
    const { vertical, horizontal, binding } = fovHalfAngles(90, 9 / 16);

    assert.ok(horizontal < vertical, "a tall viewport must narrow the horizontal angle");
    close(binding, horizontal, 1e-12, "the tighter axis of a tall viewport is the horizontal one");
});

check("degenerate fov and aspect throw rather than returning a plausible angle", () =>
{
    assert.throws(() => fovHalfAngles(0, 1), TypeError);
    assert.throws(() => fovHalfAngles(180, 1), TypeError);
    assert.throws(() => fovHalfAngles(NaN, 1), TypeError);
    assert.throws(() => fovHalfAngles(45, 0), TypeError);
    assert.throws(() => fovHalfAngles(45, -1), TypeError);
});

console.log("distanceToFitSphere");

check("a 90 degree fov puts a unit sphere at exactly sqrt(2)", () =>
{
    // Hand check: half-angle 45 degrees, sin 45 = 1/sqrt(2), so d = 1 / (1/sqrt(2)) = sqrt(2).
    const d = distanceToFitSphere({ radius: 1, fovVerticalDegrees: 90, aspect: 1 });

    close(d, Math.SQRT2, 1e-12, "distance");
});

check("a 60 degree fov puts a unit sphere at exactly 2", () =>
{
    // Hand check: half-angle 30 degrees, sin 30 = 0.5, so d = 1 / 0.5 = 2.
    close(distanceToFitSphere({ radius: 1, fovVerticalDegrees: 60, aspect: 1 }), 2, 1e-12, "distance");
});

check("it is a SINE, not a tangent - the frustum plane is tangent to the sphere", () =>
{
    // The distinction is small and always in the same direction, so it needs an
    // assertion rather than a comment: tan > sin, so radius/tan is CLOSER than
    // radius/sin, and fitting a sphere with a tangent clips its silhouette.
    const half = Math.PI / 4;
    const sine = distanceToFitSphere({ radius: 100, fovVerticalDegrees: 90, aspect: 1 });
    const tangent = 100 / Math.tan(half);

    assert.ok(sine > tangent, "the sine solve must sit further out than the tangent one");
    close(sine, 141.4213, 1e-3, "sine solve");
    close(tangent, 100, 1e-3, "tangent solve");
});

check("distance scales linearly with radius and with margin", () =>
{
    const base = distanceToFitSphere({ radius: 10, fovVerticalDegrees: 45, aspect: 1.5 });

    close(distanceToFitSphere({ radius: 20, fovVerticalDegrees: 45, aspect: 1.5 }), base * 2, 1e-9, "radius");
    close(
        distanceToFitSphere({ radius: 10, fovVerticalDegrees: 45, aspect: 1.5, margin: 3 }),
        base * 3, 1e-9, "margin"
    );
});

check("a wider viewport does NOT change the distance once the vertical binds", () =>
{
    // The property that makes a fit stable across output shapes: widening a
    // already-wide frame adds horizontal room and cannot change a vertical fit.
    const a = distanceToFitSphere({ radius: 5, fovVerticalDegrees: 40, aspect: 1.5 });
    const b = distanceToFitSphere({ radius: 5, fovVerticalDegrees: 40, aspect: 2.5 });

    close(a, b, 1e-12, "distance must be aspect-independent while the vertical binds");
});

check("a tall viewport pushes the camera further out", () =>
{
    const square = distanceToFitSphere({ radius: 5, fovVerticalDegrees: 40, aspect: 1 });
    const tall = distanceToFitSphere({ radius: 5, fovVerticalDegrees: 40, aspect: 0.5 });

    assert.ok(tall > square, "a narrower frame must need more distance");
});

check("an unmeasurable bound throws rather than inventing a distance", () =>
{
    assert.throws(() => distanceToFitSphere({ radius: 0, fovVerticalDegrees: 45 }), TypeError);
    assert.throws(() => distanceToFitSphere({ radius: -1, fovVerticalDegrees: 45 }), TypeError);
    assert.throws(() => distanceToFitSphere({ radius: NaN, fovVerticalDegrees: 45 }), TypeError);
    assert.throws(() => distanceToFitSphere({ radius: 1, fovVerticalDegrees: 45, margin: 0 }), TypeError);
});

console.log("sphereViewFraction (the inverse, so the fit is measurable)");

check("a fit with margin m round-trips to a view fraction of 1/m", () =>
{
    for (const margin of [ 1, 1.05, 1.35, 2.4 ])
    {
        const radius = 137.5;
        const fovVerticalDegrees = 38;
        const aspect = 16 / 9;
        const distance = distanceToFitSphere({ radius, fovVerticalDegrees, aspect, margin });

        close(
            sphereViewFraction({ radius, distance, fovVerticalDegrees, aspect }),
            1 / margin, 1e-12, `margin ${margin}`
        );
    }
});

console.log("boundingRadiusFromSize");

check("half the diagonal, not half the longest edge", () =>
{
    // A unit cube's half-diagonal is sqrt(3)/2 = 0.866, not 0.5. Half the longest
    // edge only suffices looking straight down one of the box's own axes.
    close(boundingRadiusFromSize([ 1, 1, 1 ]), Math.sqrt(3) / 2, 1e-12, "unit cube");
    close(boundingRadiusFromSize([ 3, 4, 0 ]), 2.5, 1e-12, "3-4-5 triangle");
    assert.ok(boundingRadiusFromSize([ 10, 1, 1 ]) > 5, "must exceed half the longest edge");
});

check("a malformed size throws", () =>
{
    assert.throws(() => boundingRadiusFromSize(null), TypeError);
    assert.throws(() => boundingRadiusFromSize([ 1, 2 ]), TypeError);
    assert.throws(() => boundingRadiusFromSize([ 1, 2, NaN ]), TypeError);
});

console.log("measured hulls at build 3470007 (the defect this replaces)");

/**
 * Measured in headless Chromium against the live resource proxy. `oldFit` is what
 * `WrappedTestCamera.Focus` returned at multiplier 1; `size` is the local AABB;
 * `sphereDiameter` is `GetLongAxis()`.
 */
const HULLS = [
    { dna: "mf4_t1", size: [ 98.31892395019531, 28.756547927856445, 120.61125183105469 ], sphereDiameter: 158, oldFit: 142.7694442087696 },
    { dna: "gc1_t1", size: [ 115.22310638427734, 194.2887420654297, 142.2784423828125 ], sphereDiameter: 267, oldFit: 282.1277390581866 },
    { dna: "ab1_t1", size: [ 232.55160522460938, 398.16888427734375, 1529.34716796875 ], sphereDiameter: 1597, oldFit: 578.1832024351538 }
];

check("the old fit under-fits every measured hull, by a factor that VARIES", () =>
{
    const ratios = HULLS.map(hull =>
    {
        const fitted = distanceToFitSphere({
            radius: hull.sphereDiameter / 2,
            fovVerticalDegrees: 38,
            aspect: 1
        });

        assert.ok(
            hull.oldFit < fitted,
            `${hull.dna}: the old fit (${hull.oldFit}) should be closer than a correct one (${fitted})`
        );

        return fitted / hull.oldFit;
    });

    // The load-bearing assertion. A CONSTANT under-fit would be a calibration
    // problem that a margin could absorb; a varying one cannot be corrected by any
    // single multiplier, which is why this is a code fix rather than a tuning one.
    const spread = Math.max(...ratios) / Math.min(...ratios);

    assert.ok(spread > 2, `the under-fit must vary across hulls to rule out a constant, spread was ${spread}`);
    close(Math.min(...ratios), 1.44, 0.05, "smallest under-fit");
    close(Math.max(...ratios), 4.24, 0.05, "largest under-fit");
});

check("the old fit ignores z, which is exactly where a ship is longest", () =>
{
    // The cause, asserted rather than described. For two of three hulls the local
    // AABB's longest axis is z, and z is the one axis the old fit never reads.
    const rifter = HULLS[0];
    const apocalypse = HULLS[2];

    assert.ok(rifter.size[2] > rifter.size[0] && rifter.size[2] > rifter.size[1], "Rifter is longest in z");
    assert.ok(
        apocalypse.size[2] > apocalypse.size[1] * 3.8,
        "the Apocalypse's z is nearly four times its height, and was ignored"
    );

    // And the sphere covers what the box axes individually do not.
    for (const hull of HULLS)
    {
        assert.ok(
            hull.sphereDiameter >= Math.max(...hull.size) * 0.99,
            `${hull.dna}: the sphere diameter must bound the longest box axis`
        );
    }
});

check("a correct fit keeps apparent scale consistent across hulls", () =>
{
    // The reader-visible consequence: fitted at one margin, every hull occupies
    // the same fraction of the frame. Under the old fit this fraction varied by
    // more than 4x, which is why a Rifter and an Apocalypse never looked comparable.
    const fractions = HULLS.map(hull =>
    {
        const radius = hull.sphereDiameter / 2;
        const distance = distanceToFitSphere({ radius, fovVerticalDegrees: 38, aspect: 1, margin: 1.15 });

        return sphereViewFraction({ radius, distance, fovVerticalDegrees: 38, aspect: 1 });
    });

    for (const fraction of fractions) close(fraction, 1 / 1.15, 1e-12, "view fraction");
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
