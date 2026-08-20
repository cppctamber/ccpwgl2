/**
 * Line set paths, 2026-08-21.
 *
 * `EveChildLineSet` does not draw lines - it owns an `EveCurveLineSet`, which
 * ccpwgl already implements in full, and the real work is the shapes that turn
 * parameters into points. Those (`EveCircle`, `EveBezierCurve`) were field-only
 * stubs, so a line set produced nothing.
 *
 * Ground truth:
 * `e:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\LineSetPaths\*.cpp`.
 * These pin the geometry, which is where a port of this kind goes wrong quietly:
 * a circle with the wrong winding or a curve sampled over the wrong span still
 * renders, just not as authored.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { vec3, vec4, mat4, quat } = require("gl-matrix");


const m = loadPaths();

testCircleLiesInXZAtItsRadius();
testCircleStartsHalfASegmentIn();
testCircleCompletenessScalesSegmentsOnlyWhenAsked();
testCircleDistortIsIgnoredUntilAsked();
testCircleClosesOnlyWhenWhole();
testBezierRunsBetweenItsEndpoints();
testBezierIsPulledTowardsItsControlPoint();
testBezierCompletenessShortensFromEitherEnd();
testBezierClosesToPoint2WhenWhole();
testPointsAreEmittedThroughTheLocalTransform();
testAnimValueAdvancesAndWraps();
testAnUnimplementedPathIsInertRatherThanFatal();
console.log("Line set paths verified");


// -- circle -----------------------------------------------------------------


/**
 * Carbon lays the ring out as `(cos*r, 0, sin*r)` (`EveCircle.cpp:119-129`) - XZ,
 * with Y reserved for the distortion. Getting the plane wrong is invisible in a
 * unit test that only checks radius, so check the axis too.
 */
function testCircleLiesInXZAtItsRadius()
{
    const circle = makeCircle({ circleRadius: 10, numSegments: 8 });
    circle.GeneratePoints();

    assert.equal(circle.GetPointCount(), 8);

    for (const p of circle._points)
    {
        assert.equal(p[1], 0, "flat in Y");
        assert.ok(Math.abs(Math.hypot(p[0], p[2]) - 10) < 1e-4, "at the radius");
    }
}

/**
 * `startOffset` includes `totalArc / (2 * seg)`, so the first point sits half a
 * segment in rather than on the axis (`EveCircle.cpp:111`). A port that drops
 * that term produces a ring rotated by half a segment - which looks right in
 * isolation and wrong against anything else placed on the same object.
 */
function testCircleStartsHalfASegmentIn()
{
    const circle = makeCircle({ circleRadius: 1, numSegments: 4 });
    circle.GeneratePoints();

    const half = (Math.PI * 2) / 8;
    assert.ok(Math.abs(circle._points[0][0] - Math.cos(half)) < 1e-6, "first point is half a segment round");
    assert.ok(Math.abs(circle._points[0][2] - Math.sin(half)) < 1e-6);
}

/**
 * `completeness` runs 0..2 and the DISTANCE FROM 1 shortens the path, so 0 and 2
 * are both empty. It only removes segments when `scaleSegmentsByCompleteness` is
 * set; otherwise the same number of segments covers a shorter arc
 * (`EveCircle.cpp:92`).
 */
function testCircleCompletenessScalesSegmentsOnlyWhenAsked()
{
    const fixed = makeCircle({ numSegments: 20, completeness: 0.5, scaleSegmentsByCompleteness: false });
    fixed.GeneratePoints();
    assert.equal(fixed.GetPointCount(), 20, "segment count unchanged");

    const scaled = makeCircle({ numSegments: 20, completeness: 0.5, scaleSegmentsByCompleteness: true });
    scaled.GeneratePoints();
    assert.equal(scaled.GetPointCount(), 10, "half the arc, half the segments");

    const above = makeCircle({ numSegments: 20, completeness: 1.5, scaleSegmentsByCompleteness: true });
    above.GeneratePoints();
    assert.equal(above.GetPointCount(), 10, "1.5 is as short as 0.5 - distance from 1 is what counts");
}

/**
 * Y stays zero unless `circleDistort.y` or `.w` is non-zero - the .x/.z
 * components alone do nothing, because the gate reads only the other two
 * (`EveCircle.cpp:121`). That asymmetry is easy to "tidy" into a bug.
 */
function testCircleDistortIsIgnoredUntilAsked()
{
    const off = makeCircle({ circleRadius: 10, numSegments: 8, circleDistort: [ 5, 0, 5, 0 ] });
    off.GeneratePoints();
    assert.ok(off._points.every(p => p[1] === 0), "x and z alone do not enable it");

    const on = makeCircle({ circleRadius: 10, numSegments: 8, circleDistort: [ 1, 0.5, 1, 0.5 ] });
    on.GeneratePoints();
    assert.ok(on._points.some(p => p[1] !== 0), "y enables it");
}

/**
 * A whole ring joins its last point back to its first; a partial one must not
 * (`EveCircle.cpp:194-197`).
 */
function testCircleClosesOnlyWhenWhole()
{
    const whole = makeCircle({ numSegments: 6, completeness: 1 });
    whole.GeneratePoints();
    assert.equal(collect(whole).length, 6, "six points, six segments - closed");

    const partial = makeCircle({ numSegments: 6, completeness: 0.5, scaleSegmentsByCompleteness: false });
    partial.GeneratePoints();
    assert.equal(collect(partial).length, 5, "open - no closing segment");
}


// -- bezier -----------------------------------------------------------------


/**
 * At completeness 1 the samples span [0, 1), so the first point IS `point1` and
 * the last stops one segment short of `point2` (`EveBezierCurve.cpp:114-123`).
 */
function testBezierRunsBetweenItsEndpoints()
{
    const curve = makeBezier({
        point1: [ 0, 0, 0 ],
        point2: [ 10, 0, 0 ],
        bezierPoint: [ 5, 0, 0 ],
        segments: 10,
        scaleSegmentsByCompleteness: false
    });
    curve.GeneratePoints();

    assert.equal(curve.GetPointCount(), 10);
    assert.deepEqual([ ...curve._points[0] ], [ 0, 0, 0 ], "starts at point1");
    assert.ok(curve._points[9][0] < 10, "and stops short of point2");
    assert.ok(curve._points[9][0] > 8, "but close to it");
}

/**
 * The control point bends the curve without being reached: the midpoint of a
 * curve pulled sideways sits half way to it, not on it.
 */
function testBezierIsPulledTowardsItsControlPoint()
{
    const curve = makeBezier({
        point1: [ 0, 0, 0 ],
        point2: [ 10, 0, 0 ],
        bezierPoint: [ 5, 10, 0 ],
        segments: 10,
        scaleSegmentsByCompleteness: false
    });
    curve.GeneratePoints();

    const mid = curve._points[5];
    assert.ok(mid[1] > 0, "bent towards the control point");
    assert.ok(mid[1] < 10, "without reaching it");
    assert.ok(Math.abs(mid[1] - 5) < 0.6, `about half way, got ${mid[1]}`);
}

/**
 * Below 1, completeness trims the FAR end; above 1 it trims the NEAR end
 * (`EveBezierCurve.cpp:117` - the span is [max(0,c-1), min(c,1)]). A port that
 * clamps completeness to 0..1 loses the second half of that behaviour silently.
 */
function testBezierCompletenessShortensFromEitherEnd()
{
    const base = { point1: [ 0, 0, 0 ], point2: [ 10, 0, 0 ], bezierPoint: [ 5, 0, 0 ], segments: 10, scaleSegmentsByCompleteness: false };

    const near = makeBezier({ ...base, completeness: 0.5 });
    near.GeneratePoints();
    assert.deepEqual([ ...near._points[0] ], [ 0, 0, 0 ], "still starts at point1");
    assert.ok(near._points[9][0] < 5.5, "but ends about half way");

    const far = makeBezier({ ...base, completeness: 1.5 });
    far.GeneratePoints();
    assert.ok(far._points[0][0] > 4.5, "starts about half way");
    assert.ok(far._points[9][0] > 9, "and runs to the end");
}

/**
 * The last sample never reaches `point2`, so a whole curve needs a closing
 * segment to it; a shortened one is meant to stop short and skips it
 * (`EveBezierCurve.cpp:186-198`).
 */
function testBezierClosesToPoint2WhenWhole()
{
    const base = { point1: [ 0, 0, 0 ], point2: [ 10, 0, 0 ], bezierPoint: [ 5, 0, 0 ], segments: 5, scaleSegmentsByCompleteness: false };

    const whole = makeBezier({ ...base, completeness: 1 });
    whole.GeneratePoints();
    const segments = collect(whole);
    assert.equal(segments.length, 5);
    assert.ok(Math.abs(segments[4].end[0] - 10) < 1e-6, "final segment lands exactly on point2");

    const partial = makeBezier({ ...base, completeness: 0.5 });
    partial.GeneratePoints();
    assert.equal(collect(partial).length, 4, "shortened curve has no closing segment");
}


// -- shared -----------------------------------------------------------------


/**
 * Points are generated in the path's own space and emitted through
 * `localTransform` - NOT `worldTransform`. The line set carries them the rest of
 * the way, so emitting through the world transform would apply the parent chain
 * twice (`EveCircle.cpp:200`).
 */
function testPointsAreEmittedThroughTheLocalTransform()
{
    const circle = makeCircle({ circleRadius: 1, numSegments: 4, translation: [ 100, 0, 0 ] });

    const parent = mat4.fromTranslation(mat4.create(), [ 0, 500, 0 ]);
    circle.GeneratePoints(parent);

    assert.ok(circle._points.every(p => Math.abs(p[0]) <= 1.001), "raw points are untransformed");

    const segments = collect(circle);
    assert.ok(segments.every(s => Math.abs(s.start[0] - 100) <= 1.001), "emitted through the local translation");
    assert.ok(segments.every(s => s.start[1] === 0), "and NOT through the parent's");

    assert.ok(
        Math.abs(mat4.getTranslation(vec3.create(), circle.worldTransform)[1] - 500) < 1e-6,
        "though the world transform did receive the parent"
    );
}

/**
 * `animValue` advances by `movementSpeed * dt` and wraps at 1
 * (`EveCircle.cpp:67-73`); it rotates the ring by a fraction of ONE segment, so
 * without the wrap it would drift without bound.
 */
function testAnimValueAdvancesAndWraps()
{
    const circle = makeCircle({ numSegments: 8, movementSpeed: 0.75 });
    circle._regeneratePoints = false;

    circle.Update(1);
    assert.ok(Math.abs(circle.animValue - 0.75) < 1e-6);

    circle.Update(1);
    assert.ok(Math.abs(circle.animValue - 0.5) < 1e-6, "wrapped rather than reaching 1.5");
}


/**
 * `EveLineChildContainer` is a path that is still a shell, and it appears in
 * shipped content (`chjita_fx_01a`) next to implemented ones. If the base
 * declared its three overridables `@meta.abstract` - which replaces the body with
 * a throw - loading Jita would die on a class nobody has written yet. A path with
 * no implementation must simply contribute nothing.
 */
function testAnUnimplementedPathIsInertRatherThanFatal()
{
    const bare = new m.IEveLineSetPath();

    assert.doesNotThrow(() => bare.GeneratePoints());
    assert.doesNotThrow(() => bare.CalculateBoundingSphere());
    assert.equal(bare.GetPointCount(), 0);
    assert.deepEqual(collect(bare), [], "contributes no segments");
}


// -- harness ----------------------------------------------------------------


/** A line set that records what it was handed. */
function collect(pathObject)
{
    const segments = [];

    const lineSet = {
        AddStraightLine(start, end, width, startColor)
        {
            segments.push({ start: [ ...start ], end: [ ...end ], width, color: [ ...startColor ] });
            return { ChangeAnimation() {} };
        }
    };

    pathObject.AddLinesToSet(lineSet, vec4.fromValues(1, 1, 1, 1), vec4.create(), 0);
    return segments;
}

function makeCircle(values = {})
{
    return applyValues(new m.EveCircle(), values);
}

function makeBezier(values = {})
{
    return applyValues(new m.EveBezierCurve(), values);
}

function applyValues(target, values)
{
    for (const [ key, value ] of Object.entries(values))
    {
        if (Array.isArray(value)) target[key].set(value);
        else target[key] = value;
    }
    return target;
}

function loadPaths()
{
    const
        meta = makeMeta(),
        utils = { meta },
        math = { vec3, vec4, mat4, quat },
        base = load("../src/eve/item/IEveLineSetPath.js", {
            utils,
            math,
            "eve/child/EveChildTransform": { EveChildTransform: makeTransformBase() }
        }),
        deps = { utils, math, "./IEveLineSetPath": base };

    return {
        IEveLineSetPath: base.IEveLineSetPath,
        EveCircle: load("../src/eve/item/EveCircle.js", deps).EveCircle,
        EveBezierCurve: load("../src/eve/item/EveBezierCurve.js", deps).EveBezierCurve
    };
}

/**
 * `EveChildTransform` drags in EveEntity and the component registry, none of
 * which a path touches. Only `UpdateTransform` matters, and it is reproduced
 * here in its simple form - the static-rotation/static-scale branches are not
 * reachable from a path, which never sets those flags.
 */
function makeTransformBase()
{
    return class
    {
        translation = vec3.create();
        rotation = quat.fromValues(0, 0, 0, 1);
        scaling = vec3.fromValues(1, 1, 1);
        localTransform = mat4.create();
        worldTransform = mat4.create();
        useSRT = true;
        staticTransform = false;

        UpdateTransform(parentTransform)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
            return mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
        }
    };
}

function load(relativePath, modules)
{
    const filename = path.resolve(__dirname, relativePath);
    const output = transformSync(fs.readFileSync(filename, "utf8"), {
        babelrc: false,
        configFile: false,
        filename,
        plugins: [
            [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    });
    const module = { exports: {} };
    new Function("require", "module", "exports", output.code)(id =>
    {
        if (id in modules) return modules[id];
        throw new Error(`Unexpected dependency in ${relativePath}: ${id}`);
    }, module, module.exports);
    return module.exports;
}

function makeMeta()
{
    const self = function (...args)
    {
        const target = args[0];
        const applied = typeof target === "function"
            || (typeof target === "object" && target !== null && args.length >= 2);

        return applied ? undefined : self;
    };

    return new Proxy({}, {
        get: (target, key) => (key === "Model" ? class {} : self)
    });
}
