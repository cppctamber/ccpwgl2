/**
 * Regression test: CewgLightList (CEWG tiled-forward light-list CPU data module).
 *
 * Plain node, no ccpwgl bundle involved - CewgLightList / CewgLightCuller
 * are pure typed-array logic with no GL and no "utils"/"global" aliases,
 * so they load directly via require().
 *
 * This test implements an independent SHADER SIMULATOR that walks Buffer
 * A / Buffer B exactly per the documented DX11 traversal contract (see
 * the header comment of src/core/cewg/CewgLightList.js), deriving
 * tilesPerRow/tilesPerCol from screen width/height the same way the
 * shader does, rather than trusting the module's own getters for that
 * math - so a bug in the module's tile-count formula would not be masked
 * by the test using the same (buggy) getter.
 *
 * Usage: node scripts/test-cewg-light-list.js
 */
const assert = require("assert");
const { CewgLightList } = require("../src/core/cewg/CewgLightList");

/**
 * Derives tile counts from screen size, independently of the module,
 * using the same 16px-tile ceiling-division formula from the DX11
 * shader contract: tilesPerRow = (uint(width) + 15) >> 4.
 * @param {number} width
 * @param {number} height
 * @returns {{tilesPerRow:number, tilesPerCol:number}}
 */
function deriveTileCounts(width, height)
{
    return {
        tilesPerRow: Math.max(1, (Math.trunc(width) + 15) >> 4),
        tilesPerCol: Math.max(1, (Math.trunc(height) + 15) >> 4)
    };
}

/**
 * Faithful simulation of the shader's tile traversal:
 *   cursor = A[tileIndex * 3];
 *   while (cursor != 0) { lightIndex = A[cursor]; ...; cursor = A[cursor + 1]; }
 * Returns the raw sequence of lightIndex values visited, in order,
 * including the null light (index 0) if visited.
 * @param {Uint32Array} bufferA
 * @param {number} tilesPerRow independently-derived tile count (not from the module)
 * @param {number} tx
 * @param {number} ty
 * @returns {number[]} sequence of lightIndex values visited (raw, may include 0)
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
        if (++guard > 100000)
        {
            throw new Error(`simulateTileTraversal: cursor loop guard tripped at tile (${tx}, ${ty})`);
        }
    }
    return visited;
}

/**
 * Rounds every element of a numeric array to float32 precision, so JS
 * double literals (e.g. 0.1) can be compared against values that have
 * round-tripped through a Float32Array without spurious precision diffs.
 * @param {number[]} values
 * @returns {number[]}
 */
function froundArray(values)
{
    return values.map(v => Math.fround(v));
}

/**
 * Packs a JavaScript number into IEEE-754 binary16 bits.
 * @param {number} value
 * @returns {number}
 */
function float32ToFloat16Bits(value)
{
    if (!Number.isFinite(value)) return value < 0 ? 0xFC00 : 0x7C00;

    const sign = value < 0 ? 0x8000 : 0;
    const abs = Math.abs(value);
    if (abs === 0) return sign;
    if (abs >= 65504) return sign | 0x7BFF;

    if (abs < 0.00006103515625)
    {
        return sign | Math.min(0x03FF, Math.round(abs / 0.000000059604644775390625));
    }

    const exponent = Math.floor(Math.log2(abs));
    const mantissa = Math.round((abs / Math.pow(2, exponent) - 1) * 1024);
    if (mantissa === 1024)
    {
        return sign | ((exponent + 16) << 10);
    }
    return sign | ((exponent + 15) << 10) | (mantissa & 0x03FF);
}

/**
 * Packs a light flags/inner-radius word as Buffer B row1.w.
 * @param {number} flags
 * @param {number} innerRadius
 * @returns {number}
 */
function packLightWord(flags, innerRadius)
{
    const rawFlags = flags >>> 0;
    const flagsHigh = rawFlags <= 0xFFFF ? (rawFlags << 16) >>> 0 : rawFlags & 0xFFFF0000;
    return (flagsHigh | float32ToFloat16Bits(innerRadius || 0)) >>> 0;
}

/**
 * Reads a Buffer B light row (position, radius, color, packed flags/inner-radius word, params) by 1-based index.
 * @param {Float32Array} bufferBFloat
 * @param {Uint32Array} bufferBUint
 * @param {number} lightIndex
 * @returns {{position:number[], radius:number, color:number[], flags:number, params:number[]}}
 */
function readLightRow(bufferBFloat, bufferBUint, lightIndex)
{
    const base = lightIndex * 12;
    return {
        position: [ bufferBFloat[base], bufferBFloat[base + 1], bufferBFloat[base + 2] ],
        radius: bufferBFloat[base + 3],
        color: [ bufferBFloat[base + 4], bufferBFloat[base + 5], bufferBFloat[base + 6] ],
        flags: bufferBUint[base + 7] >>> 0,
        params: [ bufferBFloat[base + 8], bufferBFloat[base + 9], bufferBFloat[base + 10], bufferBFloat[base + 11] ]
    };
}

/**
 * Runs simulateTileTraversal over every tile of a screen and asserts every
 * tile visits exactly `expectedRaw` (in order).
 * @param {CewgLightList} list
 * @param {number} width
 * @param {number} height
 * @param {number[]} expectedRaw
 * @param {string} label
 */
function assertAllTiles(list, width, height, expectedRaw, label)
{
    const { tilesPerRow, tilesPerCol } = deriveTileCounts(width, height);
    const bufferA = list.GetBufferA();

    for (let ty = 0; ty < tilesPerCol; ty++)
    {
        for (let tx = 0; tx < tilesPerRow; tx++)
        {
            const visited = simulateTileTraversal(bufferA, tilesPerRow, tx, ty);
            assert.deepStrictEqual(
                visited, expectedRaw,
                `${label}: tile (${tx},${ty}) expected [${expectedRaw}] got [${visited}]`
            );
        }
    }
}

// ---------------------------------------------------------------------------
// 1. Fresh module, zero-filled: every tile of a 1920x1080 screen enumerates
//    zero lights after SetScreenSize + WriteDrawList([]).
// ---------------------------------------------------------------------------
{
    const list = new CewgLightList();
    const changed = list.SetScreenSize(1920, 1080);
    assert.strictEqual(changed, true, "first SetScreenSize call should report a layout change");

    list.WriteDrawList([]);

    // Raw traversal must visit exactly the null-light gate node [0].
    assertAllTiles(list, 1920, 1080, [ 0 ], "test1-fresh-empty");

    // The null light itself must be all-zero (radius 0, flags 0 = disabled),
    // so "effective" (shaded) light count is zero even though one node is visited.
    const nullLight = readLightRow(list.GetBufferBFloat(), list.GetBufferBUint(), 0);
    assert.strictEqual(nullLight.radius, 0, "null light radius must be 0");
    assert.strictEqual(nullLight.flags, 0, "null light flags must be 0 (disabled)");

    // Calling SetScreenSize again with the same size must NOT report a change.
    assert.strictEqual(list.SetScreenSize(1920, 1080), false, "unchanged screen size should report no layout change");

    console.log("PASS 1: fresh module + empty draw list enumerates zero effective lights on every tile");
}

// ---------------------------------------------------------------------------
// 2. Five lights set, draw list [3, 1, 4]: every tile enumerates exactly
//    [3, 1, 4] in order; Buffer B rows round-trip bit-exact.
// ---------------------------------------------------------------------------
{
    const list = new CewgLightList();
    list.SetScreenSize(1920, 1080);

    const lights = [
        { position: [ 1, 2, 3 ], radius: 10, color: [ 0.1, 0.2, 0.3 ], flags: 0x10000, params: [ 1, 2, 3, 4 ] },
        { position: [ -5, 0, 5 ], radius: 20, color: [ 1, 1, 1 ], flags: 0x10001, params: [ 5, 6, 7, 8 ] },
        { position: [ 100, 200, 300 ], radius: 30, color: [ 0.5, 0.6, 0.7 ], flags: 0xFFFFFFFF, params: [ 9, 10, 11, 12 ] },
        { position: [ 0, 0, 0 ], radius: 40, color: [ 0, 0, 0 ], flags: 0, params: [ 0, 0, 0, 0 ] },
        { position: [ -1, -2, -3 ], radius: 50, color: [ 0.9, 0.8, 0.7 ], flags: 0x20000, params: [ -1, -2, -3, -4 ] }
    ];
    list.SetLights(lights);
    list.WriteDrawList([ 3, 1, 4 ]);

    assertAllTiles(list, 1920, 1080, [ 3, 1, 4 ], "test2-draw-list");

    // Bit-exact round-trip for every light, including the high-half flag bits,
    // packed inner-radius low bits, and the NaN-pattern-like 0xFFFFFFFF value.
    const bf = list.GetBufferBFloat();
    const bu = list.GetBufferBUint();
    for (let i = 0; i < lights.length; i++)
    {
        const expected = lights[i];
        const row = readLightRow(bf, bu, i + 1);
        // Compare against float32-rounded expectations: the values are
        // genuinely stored at float32 precision (that IS the bit-exact
        // round-trip being tested), so the JS double literals above need
        // the same rounding applied before comparison.
        assert.deepStrictEqual(row.position, froundArray(expected.position), `light ${i + 1} position`);
        assert.strictEqual(row.radius, Math.fround(expected.radius), `light ${i + 1} radius`);
        assert.deepStrictEqual(row.color, froundArray(expected.color), `light ${i + 1} color`);
        assert.strictEqual(row.flags >>> 0, packLightWord(expected.flags, expected.innerRadius ?? expected.params[0]) >>> 0, `light ${i + 1} packed flags/inner-radius word`);
        assert.deepStrictEqual(row.params, froundArray(expected.params), `light ${i + 1} params`);
    }
    // Explicit call-out for the two flag values named in the spec.
    assert.strictEqual((readLightRow(bf, bu, 1).flags & 0xFFFF0000) >>> 0, 0x10000, "light 1 high flags must be exactly 0x10000");
    assert.strictEqual((readLightRow(bf, bu, 3).flags & 0xFFFF0000) >>> 0, 0xFFFF0000, "light 3 high flags must be exactly 0xFFFF0000");

    console.log("PASS 2: 5 lights set + draw list [3,1,4] traverses correctly on every tile; Buffer B round-trips bit-exact");
}

// ---------------------------------------------------------------------------
// 3. Resize 1920x1080 -> 800x600: headers still consistent (all tiles reach
//    the chain); this module rebases the list region on layout change, so
//    WriteDrawList must be reissued, after which every tile is consistent
//    again at the new (smaller) tile grid.
// ---------------------------------------------------------------------------
{
    const list = new CewgLightList();
    list.SetScreenSize(1920, 1080);
    list.SetLights([
        { position: [ 1, 1, 1 ], radius: 5, color: [ 1, 0, 0 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] },
        { position: [ 2, 2, 2 ], radius: 6, color: [ 0, 1, 0 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] }
    ]);
    list.WriteDrawList([ 1, 2 ]);
    assertAllTiles(list, 1920, 1080, [ 1, 2 ], "test3-before-resize");

    const listBaseBefore = list.GetListBase();
    const changed = list.SetScreenSize(800, 600);
    assert.strictEqual(changed, true, "shrinking the screen must report a layout change");
    const listBaseAfter = list.GetListBase();
    assert.notStrictEqual(listBaseAfter, listBaseBefore, "this module rebases listBase on layout change (chosen contract)");

    // Immediately after a layout change (before WriteDrawList is reissued),
    // the module's own invariant holds: every header reaches a gate node
    // that resolves to the null light, so nothing is under-defined.
    assertAllTiles(list, 800, 600, [ 0 ], "test3-post-resize-before-redraw");

    // Reissue the draw list at the new resolution; headers must still all
    // reach the (rebased) chain consistently across the new tile grid.
    list.WriteDrawList([ 2, 1 ]);
    assertAllTiles(list, 800, 600, [ 2, 1 ], "test3-post-resize-after-redraw");

    console.log("PASS 3: resize 1920x1080 -> 800x600 rebases listBase and remains consistent across all tiles");
}

// ---------------------------------------------------------------------------
// 4. K=0 after K=3: tiles enumerate zero *effective* lights (chain reaches
//    only the null light: lightIndex 0, Buffer B radius 0 / flags 0).
// ---------------------------------------------------------------------------
{
    const list = new CewgLightList();
    list.SetScreenSize(1920, 1080);
    list.SetLights([
        { position: [ 0, 0, 0 ], radius: 1, color: [ 1, 1, 1 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] },
        { position: [ 0, 0, 0 ], radius: 2, color: [ 1, 1, 1 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] },
        { position: [ 0, 0, 0 ], radius: 3, color: [ 1, 1, 1 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] }
    ]);
    list.WriteDrawList([ 1, 2, 3 ]);
    assertAllTiles(list, 1920, 1080, [ 1, 2, 3 ], "test4-before-K0");

    list.WriteDrawList([]);
    assertAllTiles(list, 1920, 1080, [ 0 ], "test4-after-K0");

    const nullLight = readLightRow(list.GetBufferBFloat(), list.GetBufferBUint(), 0);
    assert.strictEqual(nullLight.radius, 0, "null light radius must remain 0");
    assert.strictEqual(nullLight.flags, 0, "null light flags must remain 0 (disabled)");

    console.log("PASS 4: K=0 after K=3 collapses every tile back to the null light (zero effective lights)");
}

// ---------------------------------------------------------------------------
// 5. Buffer A texel packing: element e lands at texel (e>>2) with channel
//    (e&3), texture width 2048.
// ---------------------------------------------------------------------------
{
    const list = new CewgLightList();
    list.SetScreenSize(1920, 1080); // large enough that Buffer A spans >1 texture row
    list.SetLights([ { position: [ 1, 2, 3 ], radius: 9, color: [ 0.1, 0.2, 0.3 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] } ]);
    list.WriteDrawList([ 1 ]);

    const info = list.GetBufferATextureInfo();
    assert.strictEqual(info.width, 2048, "Buffer A texture width must be fixed at 2048");
    assert.ok(info.height > 1, "test fixture should span more than one texture row to exercise y>0");

    const bufferA = list.GetBufferA();
    const sampleElements = [ 0, 1, 2, 3, 4, 7, list.GetListBase(), list.GetListBase() + 1, 9000, bufferA.length - 1 ];
    for (const e of sampleElements)
    {
        const texelIndex = e >> 2;
        const channel = e & 3;
        const x = texelIndex % info.width;
        const y = Math.floor(texelIndex / info.width);
        const texel = list.ReadBufferATexel(x, y);
        assert.strictEqual(texel[channel], bufferA[e], `element ${e} should land at texel (${x},${y}) channel ${channel}`);
    }

    console.log("PASS 5: Buffer A texel packing (e>>2, e&3) verified against the texture-shaped view");
}

// ---------------------------------------------------------------------------
// 6. Capacity guards: >maxLights in SetLights throws; draw list referencing
//    index 0 or out-of-range throws.
// ---------------------------------------------------------------------------
{
    const list = new CewgLightList({ maxLights: 4 });
    list.SetScreenSize(640, 480);

    const tooManyLights = [];
    for (let i = 0; i < 5; i++)
    {
        tooManyLights.push({ position: [ 0, 0, 0 ], radius: 1, color: [ 1, 1, 1 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] });
    }
    assert.throws(
        () => list.SetLights(tooManyLights),
        /exceeds capacity/,
        "SetLights with more lights than maxLights must throw"
    );

    // A valid-sized SetLights should still work after the rejected call.
    list.SetLights(tooManyLights.slice(0, 4));

    assert.throws(
        () => list.WriteDrawList([ 0 ]),
        /out of range/,
        "WriteDrawList referencing reserved null-light index 0 must throw"
    );
    assert.throws(
        () => list.WriteDrawList([ 5 ]),
        /out of range/,
        "WriteDrawList referencing an out-of-range index (> maxLights) must throw"
    );
    assert.throws(
        () => list.WriteDrawList([ 1, 2, 3, 4, 1 ]),
        /exceeds maxLights/,
        "WriteDrawList longer than maxLights must throw"
    );

    // And a valid draw list still works after the rejected calls.
    list.WriteDrawList([ 1, 2, 3, 4 ]);
    assertAllTiles(list, 640, 480, [ 1, 2, 3, 4 ], "test6-valid-after-guards");

    console.log("PASS 6: capacity guards reject oversized SetLights and invalid/out-of-range WriteDrawList entries");
}

console.log("PASS");
