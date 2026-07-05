/**
 * Regression test: CewgLightCollector (CEWG scene light collection + CPU cull).
 *
 * Plain node, no ccpwgl bundle involved - CewgLightCollector /
 * CewgLightList / CewgLightCuller are pure typed-array logic with no GL
 * and no "utils"/"global" aliases, so they load directly via require().
 *
 * Style matches scripts/test-cewg-light-list.js: an independent shader
 * traversal simulator walks Buffer A / Buffer B per the documented DX11
 * contract, rather than trusting the module's own getters for tile math.
 *
 * Usage: node scripts/test-cewg-light-collector.js
 */
const assert = require("assert");
const { CewgLightCollector } = require("../src/core/cewg/CewgLightCollector");

/**
 * Faithful simulation of the shader's tile traversal (see
 * scripts/test-cewg-light-list.js for the same helper).
 * @param {Uint32Array} bufferA
 * @param {number} tilesPerRow
 * @param {number} tx
 * @param {number} ty
 * @returns {number[]}
 */
function simulateTileTraversal(bufferA, tilesPerRow, tx, ty)
{
    const tileIndex = (ty * tilesPerRow + tx) * 3;
    let cursor = bufferA[tileIndex];
    const visited = [];
    let guard = 0;
    while (cursor !== 0)
    {
        const lightIndex = bufferA[cursor];
        visited.push(lightIndex);
        cursor = bufferA[cursor + 1];
        if (++guard > 100000) throw new Error(`simulateTileTraversal: cursor loop guard tripped at tile (${tx}, ${ty})`);
    }
    return visited;
}

/**
 * Runs simulateTileTraversal over tile (0,0) of a screen already sized via
 * SetScreenSize on the collector's owned light list, and returns the
 * visited lightIndex sequence.
 * @param {CewgLightCollector} collector
 * @returns {number[]}
 */
function traverseTile00(collector)
{
    const list = collector.GetLightList();
    return simulateTileTraversal(list.GetBufferA(), list.GetTilesPerRow(), 0, 0);
}

function makeRow(overrides = {})
{
    return Object.assign({
        position: [ 0, 0, 0 ],
        radius: 10,
        color: [ 1, 1, 1 ],
        flags: CewgLightCollector.FLAG_ENABLED,
        params: [ 0, 0, 0, 0 ]
    }, overrides);
}

// A wide-open frustum (no planes) and a "neutral" projection (viewportHeight/
// fovY of 0) mean ComputePixelSize returns Infinity and the cutoff never
// rejects, so tests that aren't specifically about the pixel cutoff can
// ignore it entirely by omitting viewportHeight/fovY.
const NO_CUTOFF = { frustumPlanes: [], cameraPosition: [ 0, 0, 0 ] };

// ---------------------------------------------------------------------------
// 1. Empty collect -> gate node: Resolve() with nothing collected writes the
//    empty draw list, so every tile visits only the null light (index 0).
// ---------------------------------------------------------------------------
{
    const collector = new CewgLightCollector();
    collector.GetLightList().SetScreenSize(1920, 1080);

    collector.Reset();
    const result = collector.Resolve(NO_CUTOFF);

    assert.strictEqual(result.collectedCount, 0, "collectedCount must be 0 with nothing collected");
    assert.strictEqual(result.lightCount, 0, "lightCount must be 0 with nothing collected");
    assert.deepStrictEqual(traverseTile00(collector), [ 0 ], "empty collect must resolve to the gate node (null light only)");

    console.log("PASS 1: empty collect -> gate node");
}

// ---------------------------------------------------------------------------
// 2. Cull rejects: radius<=0, brightness<=0 (unset enabled bit), and
//    behind-frustum, while a legitimate light in the same batch survives.
// ---------------------------------------------------------------------------
{
    const collector = new CewgLightCollector();
    collector.GetLightList().SetScreenSize(1920, 1080);

    collector.Reset();
    collector.Collect([
        makeRow({ position: [ 1, 0, 0 ], radius: 0 }),                          // radius<=0
        makeRow({ position: [ 2, 0, 0 ], radius: 5, flags: 0 }),                // brightness<=0 (enabled bit unset)
        makeRow({ position: [ 0, 0, 0 ], radius: 1 }),                          // behind frustum (see plane below)
        makeRow({ position: [ 3, 0, 0 ], radius: 5 })                           // survives
    ]);

    // Single plane requiring x >= 2 (a=1,b=0,c=0,d=-2); the third light sits
    // at x=0 with radius 1, fully outside (signedDistance -2 < -1). The
    // surviving light at x=3, radius 5 is inside (signedDistance 1, not < -5).
    const result = collector.Resolve({
        frustumPlanes: [ [ 1, 0, 0, -2 ] ],
        cameraPosition: [ 0, 0, 0 ]
    });

    assert.strictEqual(result.collectedCount, 4, "collectedCount must reflect all collected rows");
    assert.strictEqual(result.lightCount, 1, "only the un-culled light should survive");
    assert.deepStrictEqual(traverseTile00(collector), [ 1 ], "surviving light must be the only node in the shared chain");

    const survivorColor = collector.GetLightList().GetBufferBFloat().subarray(12 + 4, 12 + 7);
    assert.deepStrictEqual(Array.from(survivorColor), [ 1, 1, 1 ], "surviving light's color must be untouched (no size dimming configured)");

    console.log("PASS 2: cull rejects radius<=0 / brightness<=0 / behind-frustum, keeps the legitimate light");
}

// ---------------------------------------------------------------------------
// 3. Pixel cutoff at 7px with a 5px fade band: below 2px rejected outright,
//    2-7px linearly dimmed, at/above 7px unaffected. viewportHeight=1080,
//    fovY = 90deg (tan(45deg) = 1) and radius=1 make pixelSize = 1080/distance,
//    so distance can be chosen to land exactly on each boundary.
// ---------------------------------------------------------------------------
{
    const fovY = Math.PI / 2; // tan(fovY/2) = tan(45deg) = 1
    const viewportHeight = 1080;

    // Direct pure-function checks (no collector involved) for exact boundaries.
    assert.ok(Math.abs(CewgLightCollector.ComputePixelSize(1, 1080 / 7, viewportHeight, fovY) - 7) < 1e-9, "pixelSize at distance 1080/7 must be ~7");
    assert.strictEqual(CewgLightCollector.ComputeSizeDimming(7, 7, 5), 1, "dimming at exactly the cutoff must be 1");
    assert.strictEqual(CewgLightCollector.ComputeSizeDimming(2, 7, 5), 0, "dimming at exactly the fade-band floor (cutoff-fadeBand=2) must be 0");
    assert.strictEqual(CewgLightCollector.ComputeSizeDimming(4.5, 7, 5), 0.5, "dimming halfway across the fade band (4.5) must be 0.5");
    assert.strictEqual(CewgLightCollector.ComputeSizeDimming(10, 7, 5), 1, "dimming above the cutoff must be 1");
    assert.strictEqual(CewgLightCollector.ComputeSizeDimming(0, 7, 5), 0, "dimming at pixelSize 0 must be 0");

    // End-to-end through Resolve(): three lights at distances producing
    // pixelSize 10 (unaffected), 4.5 (half-dimmed), and 1 (culled outright).
    const collector = new CewgLightCollector();
    collector.GetLightList().SetScreenSize(1920, 1080);
    collector.Reset();
    collector.Collect([
        makeRow({ position: [ 1080 / 10, 0, 0 ], radius: 1, color: [ 1, 1, 1 ] }), // pixelSize 10 -> dimming 1
        makeRow({ position: [ 1080 / 4.5, 0, 0 ], radius: 1, color: [ 1, 1, 1 ] }), // pixelSize 4.5 -> dimming 0.5
        makeRow({ position: [ 1080 / 1, 0, 0 ], radius: 1, color: [ 1, 1, 1 ] })    // pixelSize 1 -> culled
    ]);

    const result = collector.Resolve({
        frustumPlanes: [],
        viewportHeight,
        fovY,
        cameraPosition: [ 0, 0, 0 ]
    });

    assert.strictEqual(result.lightCount, 2, "only the two lights at/above the fade floor should survive the pixel cutoff");

    const bf = collector.GetLightList().GetBufferBFloat();
    // Survivors are sorted by contribution (radius^2/distanceSq) descending;
    // the closer (pixelSize 10) light has the smaller distance -> higher
    // contribution -> Buffer B index 1; the pixelSize-4.5 light is index 2.
    assert.deepStrictEqual(Array.from(bf.subarray(1 * 12 + 4, 1 * 12 + 7)), [ 1, 1, 1 ], "unaffected (pixelSize 10) light keeps full color");
    assert.deepStrictEqual(Array.from(bf.subarray(2 * 12 + 4, 2 * 12 + 7)), [ 0.5, 0.5, 0.5 ], "half-dimmed (pixelSize 4.5) light's color must be scaled by 0.5");

    console.log("PASS 3: pixel cutoff at 7px with 5px fade band rejects/dims/passes correctly");
}

// ---------------------------------------------------------------------------
// 4. Capacity clamp: more surviving candidates than maxLights truncates to
//    the highest-contribution survivors (closest/largest lights).
// ---------------------------------------------------------------------------
{
    const collector = new CewgLightCollector({ lightList: { maxLights: 4 } });
    collector.GetLightList().SetScreenSize(640, 480);

    collector.Reset();
    const rows = [];
    for (let i = 0; i < 6; i++)
    {
        // Distance increases with i, so contribution (radius^2/distSq)
        // strictly decreases with i - light 0 is the strongest survivor.
        rows.push(makeRow({ position: [ i + 1, 0, 0 ], radius: 5 }));
    }
    collector.Collect(rows);

    const result = collector.Resolve(NO_CUTOFF);

    assert.strictEqual(result.collectedCount, 6, "collectedCount must reflect all 6 collected rows");
    assert.strictEqual(result.lightCount, 4, "lightCount must be clamped to the light list's capacity (4)");
    assert.deepStrictEqual(traverseTile00(collector), [ 1, 2, 3, 4 ], "shared chain must contain exactly 4 nodes");

    // The 4 survivors must be the 4 closest (strongest contribution) lights,
    // i.e. rows 0-3 (positions x=1..4), not rows 4-5 (x=5,6).
    const bf = collector.GetLightList().GetBufferBFloat();
    for (let i = 1; i <= 4; i++)
    {
        const x = bf[i * 12];
        assert.ok(x <= 4, `survivor Buffer B index ${i} must be one of the 4 closest lights (x<=4), got x=${x}`);
    }

    // An explicit maxLights override (lower than list capacity) must also be honoured.
    collector.Reset();
    collector.Collect(rows);
    const result2 = collector.Resolve(Object.assign({ maxLights: 2 }, NO_CUTOFF));
    assert.strictEqual(result2.lightCount, 2, "an explicit maxLights option must further clamp the survivor count");

    console.log("PASS 4: capacity clamp truncates to the highest-contribution survivors");
}

console.log("PASS");
