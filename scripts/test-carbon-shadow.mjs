/**
 * Regression test: Tw2CarbonShadowData — Carbon cascaded shadow maths.
 *
 * The composition order in these matrices is the silent-bug class the
 * carbon-math-conventions skill warns about: Carbon is row-vector, gl-matrix is
 * column-vector, so every operand reverses. An identity-ish fixture passes with
 * EITHER order, so the fixtures here use a rotated, off-origin camera and a sun
 * that is not axis-aligned, and assert positions rather than just "it ran".
 *
 * The load-bearing property: a cascade's matrix maps a point at the centre of
 * that cascade's view sub-frustum to the CENTRE OF ITS OWN ATLAS TILE. That one
 * assertion exercises the whole chain — sub-frustum, light basis, AABB, ortho,
 * the NDC-to-UV bias and the tile fold — and it localises a failure, because a
 * wrong operand order lands the point in a different tile or outside 0..1.
 */
import assert from "assert";
import { mat4, vec3, vec4 } from "gl-matrix";
import {
    SHADOW_FRUSTUM_COUNT,
    buildLightView,
    buildCascadeMatrix,
    BuildProjectionInverse,
    GetFrustumRatios
} from "../src/core/carbon/Tw2CarbonShadowData.js";
import { carbonPerspectiveOffCenter } from "../src/global/math/carbonProjection.js";

let failures = 0;
function check(name, fn)
{
    try { fn(); console.log(`  ok   ${name}`); }
    catch (err) { failures++; console.log(`  FAIL ${name}\n       ${err.message}`); }
}

// A camera that is rotated and translated, so a reversed composition cannot pass
const view = mat4.lookAt(mat4.create(), [ 1200, 400, -900 ], [ 30, -50, 60 ], [ 0, 1, 0 ]);
const projection = mat4.perspective(mat4.create(), Math.PI / 3, 16 / 9, 1, 1000000);
const sun = vec3.normalize(vec3.create(), [ 0.4, -0.8, 0.45 ]);

const inverseView = mat4.invert(mat4.create(), view);
const lightView = buildLightView(mat4.create(), sun);
const frustum = GetFrustumRatios(projection);

const CELLS_X = 4, CELLS_Y = 1, TILE = 1024;
const SPLITS = [ 100, 1000, 10000, 100000 ];

console.log("Carbon shadow cascade maths");

check("frustum ratios round-trip through the projection", () =>
{
    // Rebuilding the projection from the extracted ratios must reproduce x/y.
    const rebuilt = carbonPerspectiveOffCenter(
        mat4.create(),
        frustum.leftDivNear * 1, frustum.rightDivNear * 1,
        frustum.bottomDivNear * 1, frustum.topDivNear * 1,
        1, 1000000
    );
    for (const i of [ 0, 5, 8, 9 ])
    {
        assert.ok(Math.abs(rebuilt[i] - projection[i]) < 1e-5,
            `element ${i}: ${rebuilt[i]} vs ${projection[i]}`);
    }
});

check("light view puts the sun along -Z", () =>
{
    const out = vec3.transformMat4(vec3.create(), sun, lightView);
    // A direction, so drop the translation-free basis check to orientation only
    vec3.normalize(out, out);
    assert.ok(out[2] < -0.99, `sun maps to ${out} in light space, expected ~(0,0,-1)`);
});

for (let i = 0; i < SPLITS.length; i++)
{
    check(`cascade ${i} centre lands in its own atlas tile`, () =>
    {
        const zNear = i === 0 ? 1 : SPLITS[i - 1];
        const zFar = SPLITS[i];

        const m = buildCascadeMatrix(mat4.create(), {
            inverseView, lightView, frustum, zNear, zFar,
            index: i, cellsX: CELLS_X, cellsY: CELLS_Y, tileSize: TILE,
            disableShimmer: false
        });

        // Centre of this cascade's slice, on the view axis, in VIEW space -
        // the matrix consumes view space, not world space.
        const centre = [ 0, 0, -(zNear + zFar) / 2, 1 ];
        const uv = vec4.transformMat4(vec4.create(), centre, m);

        const
            u = uv[0] / uv[3],
            v = uv[1] / uv[3],
            expectedU = (i % CELLS_X + 0.5) / CELLS_X,
            expectedV = (Math.floor(i / CELLS_X) + 0.5) / CELLS_Y;

        // Inside its own tile is the real invariant. The axial midpoint is
        // NOT the light-space AABB centre - a frustum slice is a truncated
        // pyramid, so its bounding box centre sits off the view axis - which is
        // why this asserts containment rather than an exact centre hit.
        assert.ok(u > i / CELLS_X && u < (i + 1) / CELLS_X,
            `u ${u.toFixed(4)} is outside tile ${i} (${i / CELLS_X}..${(i + 1) / CELLS_X})`);
        assert.ok(v > 0 && v < 1, `v ${v.toFixed(4)} is outside the atlas`);
        assert.ok(Math.abs(u - expectedU) < 0.15, `u ${u.toFixed(4)} far from tile centre ${expectedU}`);
        assert.ok(Math.abs(v - expectedV) < 0.15, `v ${v.toFixed(4)} far from tile centre ${expectedV}`);
    });
}

check("cascade depth is inside 0..1 for a point in the slice", () =>
{
    const m = buildCascadeMatrix(mat4.create(), {
        inverseView, lightView, frustum, zNear: 1, zFar: SPLITS[0],
        index: 0, cellsX: CELLS_X, cellsY: CELLS_Y, tileSize: TILE,
        disableShimmer: false
    });
    const uv = vec4.transformMat4(vec4.create(), [ 0, 0, -50, 1 ], m);
    const z = uv[2] / uv[3];
    assert.ok(z >= 0 && z <= 1, `depth ${z} outside 0..1 - the ortho is not D3D form`);
});

check("ProjectionInverse round-trips an OFF-AXIS point, screen flip included", () =>
{
    // On-axis points cannot see a Y mirror - x and y are both zero, so the sign
    // is invisible. That is why the axial check below passed while the resolve
    // was reconstructing every fragment mirrored about the screen centre.
    const projInv = BuildProjectionInverse(mat4.create(), projection);

    for (const viewPos of [ [ 120, 80, -500, 1 ], [ -300, 220, -4000, 1 ] ])
    {
        const clip = vec4.transformMat4(vec4.create(), viewPos, projection);
        const ndc = [ clip[0] / clip[3], clip[1] / clip[3], clip[2] / clip[3] ];
        const rawDepth = ndc[2] * 0.5 + 0.5;

        // Exactly what the translated resolve feeds the matrix: NDC x, NEGATED
        // NDC y (the shader's own D3D flip), and the raw depth sample.
        const fed = vec4.fromValues(ndc[0], -ndc[1], rawDepth, 1);
        const out = vec4.transformMat4(vec4.create(), fed, projInv);

        for (let i = 0; i < 3; i++)
        {
            const recovered = out[i] / out[3];
            assert.ok(Math.abs(recovered - viewPos[i]) < Math.abs(viewPos[i] || 1) * 1e-2,
                `component ${i}: ${viewPos[i]} recovered as ${recovered.toFixed(2)}`
                + " - a wrong Y sign mirrors every fragment about the screen centre");
        }
    }
});

check("ProjectionInverse undoes the GL projection including the depth remap", () =>
{
    const projInv = BuildProjectionInverse(mat4.create(), projection);

    for (const viewZ of [ -10, -500, -20000 ])
    {
        const viewPos = [ 0, 0, viewZ, 1 ];
        const clip = vec4.transformMat4(vec4.create(), viewPos, projection);
        const ndcZ = clip[2] / clip[3];
        // What a GL depth buffer stores
        const rawDepth = ndcZ * 0.5 + 0.5;

        // What the resolve shader feeds the matrix: raw depth as z
        const out = vec4.transformMat4(vec4.create(), [ 0, 0, rawDepth, 1 ], projInv);
        const recovered = out[2] / out[3];

        // 1e-2 relative, not tighter: a 1..1e6 projection genuinely loses
        // precision in the depth remap at range, and that is a property of the
        // depth buffer rather than of this matrix.
        assert.ok(Math.abs(recovered - viewZ) < Math.abs(viewZ) * 1e-2,
            `view z ${viewZ} recovered as ${recovered}`);
    }
});

check("cascade matrices are distinct per tile", () =>
{
    const a = buildCascadeMatrix(mat4.create(), {
        inverseView, lightView, frustum, zNear: 1, zFar: SPLITS[0],
        index: 0, cellsX: CELLS_X, cellsY: CELLS_Y, tileSize: TILE
    });
    const b = buildCascadeMatrix(mat4.create(), {
        inverseView, lightView, frustum, zNear: 1, zFar: SPLITS[0],
        index: 1, cellsX: CELLS_X, cellsY: CELLS_Y, tileSize: TILE
    });
    assert.ok(!mat4.equals(a, b), "tile index is not folded into the matrix");
});

// ---------------------------------------------------------------------------
// The checks below exist because everything above passed UNCHANGED while three
// real defects were live (2026-08-13): an inverted ortho depth direction, a
// halved snap radius, and a V mirrored against the GL raster origin. Each
// assertion above happens to be invariant under exactly the defect it missed -
// the tile-centre check survives a flip about 0.5, the range check survives a
// reversal - so these target that invariance head on.
// ---------------------------------------------------------------------------

// The eight slice corners in VIEW space, which is what a cascade matrix eats.
function sliceCorners(zNear, zFar)
{
    const sub = carbonPerspectiveOffCenter(
        mat4.create(),
        frustum.leftDivNear * zNear, frustum.rightDivNear * zNear,
        frustum.bottomDivNear * zNear, frustum.topDivNear * zNear,
        zNear, zFar
    );
    const inv = mat4.invert(mat4.create(), sub);
    const cube = [
        [ -1, -1, 0 ], [ 1, -1, 0 ], [ -1, 1, 0 ], [ 1, 1, 0 ],
        [ -1, -1, 1 ], [ 1, -1, 1 ], [ -1, 1, 1 ], [ 1, 1, 1 ]
    ];
    return cube.map(c => vec3.transformMat4(vec3.create(), c, inv));
}

check("depth DECREASES toward the light", () =>
{
    const m = buildCascadeMatrix(mat4.create(), {
        inverseView, lightView, frustum, zNear: 1, zFar: SPLITS[0],
        index: 0, cellsX: CELLS_X, cellsY: CELLS_Y, tileSize: TILE
    });

    // A point mid-slice, and the same point moved TOWARD the sun. `sun` points
    // from the sun into the scene, so -sun walks back up the light ray.
    const viewPoint = vec4.fromValues(0, 0, -SPLITS[0] / 2, 1);
    const world = vec4.transformMat4(vec4.create(), viewPoint, inverseView);
    const nearerWorld = vec4.fromValues(
        world[0] - sun[0] * 20,
        world[1] - sun[1] * 20,
        world[2] - sun[2] * 20,
        1
    );
    const nearerView = vec4.transformMat4(vec4.create(), nearerWorld, view);

    const a = vec4.transformMat4(vec4.create(), viewPoint, m);
    const b = vec4.transformMat4(vec4.create(), nearerView, m);

    assert.ok(b[2] / b[3] < a[2] / a[3],
        `moving toward the light must LOWER depth, got ${(b[2] / b[3]).toFixed(6)} vs ${(a[2] / a[3]).toFixed(6)}`
        + " - an inverted ortho makes the LEQUAL caster keep the far surface");
});

check("every slice corner lands inside its own cascade tile", () =>
{
    // Catches a snap radius smaller than the slice it was built for: the box
    // stops covering its own frustum and the cascade's outer part falls outside
    // its shadow map, which reads as shadows cut off along a straight edge.
    const zNear = 1, zFar = SPLITS[0];
    const m = buildCascadeMatrix(mat4.create(), {
        inverseView, lightView, frustum, zNear, zFar,
        index: 0, cellsX: CELLS_X, cellsY: CELLS_Y, tileSize: TILE,
        disableShimmer: true
    });

    for (const corner of sliceCorners(zNear, zFar))
    {
        const p = vec4.transformMat4(vec4.create(), vec4.fromValues(corner[0], corner[1], corner[2], 1), m);
        const u = p[0] / p[3], v = p[1] / p[3], z = p[2] / p[3];
        assert.ok(u >= 0 && u <= 1 / CELLS_X, `corner u ${u.toFixed(4)} outside tile 0`);
        assert.ok(v >= 0 && v <= 1, `corner v ${v.toFixed(4)} outside the atlas`);
        assert.ok(z >= 0 && z <= 1, `corner depth ${z.toFixed(4)} outside 0..1`);
    }
});

check("lookup V matches where the GL rasteriser stored the texel", () =>
{
    // The invariant is AGREEMENT, not a direction. The ortho already flips Y
    // through its swapped bottom/top, so "+Y means larger V" is not a property
    // either side has; what matters is that the lookup asks for the same V the
    // caster pass wrote. Carbon's -0.5 bias satisfies that under D3D's top-left
    // raster origin; WebGL's bottom-left origin needs +0.5, and carrying the
    // negation over mirrors the tile about V = 0.5.
    const ortho = mat4.create();
    const m = buildCascadeMatrix(mat4.create(), {
        orthoOut: ortho,
        inverseView, lightView, frustum, zNear: 1, zFar: SPLITS[0],
        index: 0, cellsX: CELLS_X, cellsY: CELLS_Y, tileSize: TILE,
        disableShimmer: false
    });

    // What the caster writes: view -> world -> light -> ortho, then GL's own
    // viewport transform, V = (ndc.y + 1) / 2.
    const casterClip = mat4.multiply(mat4.create(), ortho, mat4.multiply(mat4.create(), lightView, inverseView));

    for (const p of [ [ 0, 0, -SPLITS[0] / 2 ], [ 40, 60, -SPLITS[0] / 3 ], [ -70, 25, -SPLITS[0] / 1.5 ] ])
    {
        const viewPoint = vec4.fromValues(p[0], p[1], p[2], 1);

        const clip = vec4.transformMat4(vec4.create(), viewPoint, casterClip);
        const rasterV = (clip[1] / clip[3] + 1) / 2;

        const looked = vec4.transformMat4(vec4.create(), viewPoint, m);
        const lookupV = looked[1] / looked[3];

        // cellsY is 1 here, so the tile fold is the identity on V.
        assert.ok(Math.abs(lookupV - rasterV) < 1e-5,
            `lookup V ${lookupV.toFixed(6)} != raster V ${rasterV.toFixed(6)} - the atlas is sampled mirrored`);
    }
});

assert.strictEqual(SHADOW_FRUSTUM_COUNT, 16, "Carbon's cascade array size");

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
