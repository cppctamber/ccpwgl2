/**
 * Smart lights, driven off a REAL asset - 2026-08-22.
 *
 * `res:/dx9/model/shared/fx/smartlightsets/amarr_primaryspotlight_01a.black`
 * is the first shipped smart light set we found, and it exercises the whole
 * chain the synthetic tests cannot: a parent-locator placement generator, a
 * burst spawner, colour-share groups nesting the quads, and the attribute
 * modifier stack (camera dependency, colour, controller variable listeners,
 * expression buckets).
 *
 * Everything up to the draw call is pure CPU, so it runs here. The GL seams -
 * buffer creation, upload - are stubbed; what is measured is whether placements
 * are spawned, whether quads are built from them, and what colour they end up.
 * A quad built with colour 0 is invisible under additive blending, which looks
 * exactly like nothing rendering.
 *
 * The asset is fetched from the local tools-core service and cached beside this
 * script. Skipped, not failed, when neither is available - the service is not
 * part of this repository.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RES = "http://127.0.0.1:5510/eve/latest/resources/";
const ASSET = "dx9/model/shared/fx/smartlightsets/amarr_primaryspotlight_01a.black";
const CACHE = path.resolve(__dirname, "../artifacts/cache", path.basename(ASSET));

const bundle = path.resolve(__dirname, "../dist/ccpwgl2_int.js");
if (!fs.existsSync(bundle))
{
    console.log("Smart light asset skipped - no dist build");
    process.exit(0);
}

main();

async function main()
{
    const buffer = await getAsset();
    if (!buffer)
    {
        console.log("Smart light asset skipped - no local resource service and no cached copy");
        return;
    }

    stubBrowser();
    const mod = require(bundle);
    const tw2 = mod.tw2 || mod.default || mod;

    const root = new (tw2.GetClass("Tw2BlackReader"))(
        new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    ).Construct();

    const sets = [];
    root.Traverse(o =>
    {
        const s = o.struct;
        if (s && s.constructor.name === "EveChildSmartLightSet" && !sets.includes(s)) sets.push(s);
    });

    assert.ok(sets.length > 0, "the asset must hydrate at least one smart light set");
    console.log(`sets: ${sets.length}`);

    const parent = makeParent(sets);
    const report = [];

    for (const set of sets)
    {
        stubGroupGl(set);

        // Several frames: the first resolves the locators and regenerates the
        // pool (and returns early), the second lets the burst spawner fire.
        for (let frame = 0; frame < 4; frame++)
        {
            set.Update(1 / 60, identity(), { activationStrength: 1 }, parent);
        }

        // The set catches and latches, so the message is the only trace of what
        // went wrong - report it rather than just the boolean.
        assert.equal(set._failed, false,
            `${set.name} must survive its update - it latches off on the first throw: ${set._failedError || ""}`);

        const d = set.distribution;
        const quads = collectQuads(set);
        const batches = [];
        set.GetBatches(tw2.device.RM_ADDITIVE, { Commit: b => batches.push(b) }, {});

        const meshes = collect(set, "EveSmartLightMesh");
        const instanced = meshes.reduce((n, m) => n + (m.mesh?.instanceGeometryResource?._count || 0), 0);

        report.push({
            set: set.name,
            locatorSet: d.placementGenerators.map(g => g.locatorSetName).join(","),
            pooled: d._initialPlacements.length,
            live: d.placementData.length,
            quads: quads.length,
            built: quads.reduce((n, q) => n + q._quadCount, 0),
            meshes: meshes.length,
            instanced,
            batches: batches.length,
            colours: quads.map(q => Array.from(q.GetGroupColor()).map(round).join("/")).join(" ")
        });

        checkInstanceStream(meshes);
    }

    console.table(report);

    const withPlacements = report.filter(r => r.live > 0);
    assert.ok(withPlacements.length > 0, "at least one set must spawn placements - a burst spawner fills the pool on the first update after it exists");

    const withQuads = report.filter(r => r.built > 0);
    assert.ok(withQuads.length > 0, "at least one set must build quads from its placements");

    const lit = withQuads.filter(r => r.colours.split(/[\s/]+/).some(v => Number(v) > 0));
    assert.ok(lit.length > 0, "a quad built with colour 0 is invisible under additive blending - the modifier stack must not zero every group");

    const withInstances = report.filter(r => r.instanced > 0);
    assert.ok(withInstances.length > 0, "the beams must pack an instance per placement");

    console.log("Smart light asset verified");
}

/**
 * The packed instance stream, checked against the declaration it claims.
 *
 * The failure this guards is silent: a stride that disagrees with the layout,
 * or a degenerate transform, still uploads and still draws - as nothing, or as
 * geometry collapsed to a point. Neither errors.
 */
function checkInstanceStream(meshes)
{
    for (const mesh of meshes)
    {
        const data = mesh.mesh?.instanceGeometryResource;
        if (!data || !data._count) continue;

        const declared = data.GetLayout().elements.reduce((n, e) => n + e.elements * 4, 0);
        assert.equal(data.GetInstanceStride(), declared, "the stride must come from the declaration, or every instance is read at the wrong offset");
        assert.equal(data.GetInstanceStride(), 28 * 4, "seven float4 attributes per instance");

        const array = data._lastUpload;
        assert.equal(array.length, data._count * 28, "one packed instance per placement");
        assert.ok(array.every(Number.isFinite), "a NaN anywhere in the stream collapses the instance silently");

        // The 3x4 transform's basis must not be degenerate - a zero basis draws
        // the mesh at a point, which reads as "the beams do not render".
        for (let i = 0; i < data._count; i++)
        {
            const o = i * 28;
            const basis = [ 0, 1, 2, 4, 5, 6, 8, 9, 10 ].map(k => array[o + k]);
            assert.ok(basis.some(v => Math.abs(v) > 1e-6), `instance ${i} has a zero basis`);
        }
    }
}

/** Every locator set the asset's generators ask for, answered with one locator. */
function makeParent(sets)
{
    const names = new Set();
    for (const set of sets)
    {
        for (const g of set.distribution?.placementGenerators || [])
        {
            if (g.locatorSetName) names.add(String(g.locatorSetName).toLowerCase());
        }
    }

    return {
        GetLocatorsForSet(name)
        {
            if (!names.has(String(name).toLowerCase())) return null;
            return [ {
                position: Float32Array.from([ 0, 0, 10 ]),
                rotation: Float32Array.from([ 0, 0, 0, 1 ]),
                scaling: Float32Array.from([ 1, 1, 1 ]),
                boneIndex: -1
            } ];
        },
        GetLocalToWorldTransform: out => (out ? out.set(identity()) : identity())
    };
}

/** Depth-first walk of the group tree, which nests through colour-share groups. */
function collect(node, className, out = [])
{
    for (const group of node.lightGroups || [])
    {
        if (!group) continue;
        if (group.constructor.name === className) out.push(group);
        collect(group, className, out);
    }
    return out;
}

function collectQuads(node)
{
    return collect(node, "EveSmartLightQuad");
}

/**
 * No GL context here, so the buffer seams are replaced with plain arrays.
 *
 * The instance upload is captured rather than skipped: the packing is the part
 * worth measuring, and a mesh that packs nothing is indistinguishable from one
 * that packs garbage once it reaches the gpu.
 */
function stubGroupGl(set)
{
    for (const mesh of collect(set, "EveSmartLightMesh"))
    {
        const data = mesh.ConfigureInstanceData();
        if (data && !data._captured)
        {
            data._captured = true;
            data.SetData = function (array, count)
            {
                this._count = count;
                this._lastUpload = array ? Float32Array.from(array) : null;
            };
        }
    }

    for (const quad of collectQuads(set))
    {
        quad.effect = quad.effect || {};
        quad.effect.IsGood = () => true;
        quad._Reserve = function (count)
        {
            if (count <= this._capacity && this._array) return;
            this._array = new Float32Array(count * 4 * 31);
            this._capacity = count;
        };
        quad._Upload = function () { this._vertexBuffer = this._vertexBuffer || {}; };
    }
}

async function getAsset()
{
    if (fs.existsSync(CACHE)) return fs.readFileSync(CACHE);

    try
    {
        const response = await fetch(RES + ASSET, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) return null;
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.mkdirSync(path.dirname(CACHE), { recursive: true });
        fs.writeFileSync(CACHE, buffer);
        return buffer;
    }
    catch
    {
        return null;
    }
}

function round(n)
{
    return Math.round(n * 1000) / 1000;
}

function identity()
{
    return Float32Array.from([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);
}

function stubBrowser()
{
    global.window = global;
    global.self = global;
    global.navigator = { userAgent: "node" };
    global.document = {
        baseURI: "http://localhost/",
        createElement: () => ({ getContext: () => null, style: {}, addEventListener: () => {} }),
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    global.location = { search: "", href: "http://localhost/", protocol: "http:", hostname: "localhost" };
    global.requestAnimationFrame = fn => setTimeout(fn, 16);
    global.addEventListener = () => {};
    global.removeEventListener = () => {};

    const names = [ "WebGLShader", "WebGLProgram", "WebGLBuffer", "WebGLTexture", "WebGLFramebuffer",
        "WebGLRenderbuffer", "WebGLRenderingContext", "WebGL2RenderingContext", "WebGLUniformLocation",
        "WebGLVertexArrayObject", "WebGLActiveInfo", "HTMLCanvasElement", "HTMLImageElement", "Image",
        "OffscreenCanvas", "ImageBitmap", "Audio", "HTMLVideoElement", "XMLHttpRequest" ];

    for (const name of names) if (!global[name]) global[name] = class {};
}
