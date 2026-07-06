/**
 * CEWG diagnostics testbed (headless, agent-runnable).
 *
 * Loads a .cewg package through ccpwgl's REAL Tw2EffectRes pipeline with a
 * stubbed GL context and dumps everything an agent (or human) needs to debug
 * CEWG rendering, without a browser or the resource server:
 *
 *   - package: version, permutation dimensions + defaults, techniques
 *   - per technique/pass: isCewg, per stage -> vertex-input usages + attr
 *     names, constants (name/offset/size), textures+samplers (register/name),
 *     cewgBindings, and (optionally) the emitted GLSL
 *   - CewgCarbonData b1-b4 constant packing (which register gets what, and
 *     which are zeroed/synthesised)
 *   - optional .gr2 mesh: vertex declaration usages + sample vertices decoded
 *     both as float values AND int bit patterns (the two ways an attribute can
 *     be read) so blend-index / tangent channels are unambiguous
 *   - optional recorded ApplyPass: bone UBO, light textures, texture-unit and
 *     uniform-block bindings the binder actually issues
 *
 * Usage:
 *   node scripts/testbed/cewg-diagnostics.js <package> [options]
 *
 *   <package>   bare name (resolved against test/fixtures then the synthetic
 *               server cache) or an absolute/relative path to a .cewg file.
 *
 *   --options k=v,k=v   permutation option overrides (e.g.
 *                       SPACE_OBJECT_PPT_ENABLED=SOPPT_ENABLED)
 *   --technique NAME    restrict the per-pass dump to one technique
 *   --glsl              include full emitted GLSL for each stage
 *   --glsl-lines N      include the first N lines of GLSL per stage (default 0)
 *   --mesh PATH         also decode a .gr2 mesh's vertex declaration + samples
 *   --mesh-verts N      how many sample vertices to decode (default 6)
 *   --apply             run a recorded ApplyPass and dump binder/GL activity
 *   --json              emit a single JSON document instead of readable text
 *
 * Examples:
 *   node scripts/testbed/cewg-diagnostics.js unpackedskinned_quadv5.webgl.cewg
 *   node scripts/testbed/cewg-diagnostics.js unpackedskinned_quadv5_depth.webgl.cewg --options SPACE_OBJECT_PPT_ENABLED=SOPPT_ENABLED --glsl-lines 40
 */
"use strict";

const fs = require("fs");
const path = require("path");

// --------------------------------------------------------------------------
// Argument parsing
// --------------------------------------------------------------------------
function parseArgs(argv)
{
    const args = {
        package: null,
        options: {},
        technique: null,
        glsl: false,
        glslLines: 0,
        mesh: null,
        meshVerts: 6,
        apply: false,
        json: false
    };

    for (let i = 0; i < argv.length; i++)
    {
        const a = argv[i];
        if (a === "--options" && argv[i + 1])
        {
            for (const pair of argv[++i].split(","))
            {
                const eq = pair.indexOf("=");
                if (eq > 0) args.options[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
            }
        }
        else if (a === "--technique" && argv[i + 1]) args.technique = argv[++i];
        else if (a === "--glsl") args.glsl = true;
        else if (a === "--glsl-lines" && argv[i + 1]) args.glslLines = Number(argv[++i]) || 0;
        else if (a === "--mesh" && argv[i + 1]) args.mesh = argv[++i];
        else if (a === "--mesh-verts" && argv[i + 1]) args.meshVerts = Number(argv[++i]) || 6;
        else if (a === "--apply") args.apply = true;
        else if (a === "--json") args.json = true;
        else if (a === "--help" || a === "-h") { args.help = true; }
        else if (!a.startsWith("--") && !args.package) args.package = a;
    }
    return args;
}

// --------------------------------------------------------------------------
// Headless browser/GL shims (same shape as scripts/test-cewg-effect-res.js)
// --------------------------------------------------------------------------
function installShims()
{
    // Some of these are read-only built-ins in newer Node (e.g. navigator);
    // set defensively so the shim install never throws.
    const set = (key, value) =>
    {
        try { global[key] = value; }
        catch (e) { try { Object.defineProperty(global, key, { value, configurable: true, writable: true }); } catch (e2) { /* leave built-in */ } }
    };
    set("window", global);
    set("self", global);
    set("navigator", { userAgent: "node" });
    set("document", {
        createElement: () => ({ getContext: () => null, style: {}, addEventListener: () => {} }),
        addEventListener: () => {},
        removeEventListener: () => {}
    });
    set("location", { search: "", href: "http://localhost/", protocol: "http:", hostname: "localhost" });
    set("requestAnimationFrame", fn => setTimeout(fn, 16));
    set("addEventListener", () => {});
    set("removeEventListener", () => {});
    for (const name of [ "WebGLShader", "WebGLProgram", "WebGLBuffer", "WebGLTexture", "WebGLFramebuffer",
        "WebGLRenderbuffer", "WebGLRenderingContext", "WebGL2RenderingContext", "WebGLUniformLocation",
        "WebGLVertexArrayObject", "WebGLActiveInfo", "HTMLCanvasElement", "HTMLImageElement", "Image",
        "OffscreenCanvas", "ImageBitmap", "Audio", "HTMLVideoElement", "XMLHttpRequest" ])
    {
        if (!global[name]) global[name] = class {};
    }
}

/**
 * A non-recording GL stub: returns 1 for GL enum constants and a fresh object
 * for everything else. Enough to build shaders and prepare resources.
 */
function makeInertGl()
{
    return new Proxy({}, {
        get: (target, prop) =>
        {
            if (prop === "then") return undefined;
            if (prop === "getExtension") return () => null;
            if (typeof prop === "string" && /^[A-Z0-9_]+$/.test(prop)) return 1;
            return () => ({});
        }
    });
}

/**
 * A recording GL stub for the --apply pass. Returns resolvable handles/
 * locations so the CEWG bind path runs end to end, and logs every
 * state-changing call so we can report what the binder actually did.
 */
function makeRecordingGl()
{
    let nextId = 1;
    const calls = [];
    const constant = new Proxy({}, { get: (t, p) => (/^[A-Z0-9_]+$/.test(p) ? 1 : undefined) });
    const gl = {
        calls,
        TEXTURE0: 0,
        UNIFORM_BUFFER: 35345,
        // handle/location factories - unique ids so bindings resolve
        createBuffer: () => ({ id: `buf${nextId++}` }),
        createTexture: () => ({ id: `tex${nextId++}` }),
        createProgram: () => ({ id: `prog${nextId++}` }),
        createShader: () => ({ id: `sh${nextId++}` }),
        createVertexArray: () => ({ id: `vao${nextId++}` }),
        getAttribLocation: (p, name) => { calls.push([ "getAttribLocation", name ]); return hashLoc(name); },
        getUniformLocation: (p, name) => ({ id: `uloc:${name}` }),
        getUniformBlockIndex: (p, name) => { calls.push([ "getUniformBlockIndex", name ]); return hashLoc(name); },
        getProgramParameter: () => true,
        getShaderParameter: () => true,
        getProgramInfoLog: () => "",
        getShaderInfoLog: () => "",
        getError: () => 0,
        // recorded state
        useProgram: p => calls.push([ "useProgram", p && p.id ]),
        bindBuffer: (target, b) => calls.push([ "bindBuffer", target, b && b.id ]),
        bindBufferBase: (target, index, b) => calls.push([ "bindBufferBase", index, b && b.id ]),
        bufferData: (target, data) => calls.push([ "bufferData", target, data && data.length ]),
        bufferSubData: () => calls.push([ "bufferSubData" ]),
        activeTexture: unit => calls.push([ "activeTexture", unit - 0 ]),
        bindTexture: (target, t) => calls.push([ "bindTexture", target, t && t.id ]),
        uniform1i: (loc, v) => calls.push([ "uniform1i", loc && loc.id, v ]),
        uniform4fv: (loc, v) => calls.push([ "uniform4fv", loc && loc.id, v && v.length ]),
        uniformBlockBinding: (p, block, binding) => calls.push([ "uniformBlockBinding", block, binding ]),
        vertexAttribPointer: (index) => calls.push([ "vertexAttribPointer", index ]),
        enableVertexAttribArray: (index) => calls.push([ "enableVertexAttribArray", index ]),
        texParameteri: () => {},
        texImage2D: () => {},
        texSubImage2D: () => {},
        deleteBuffer: () => {},
        deleteTexture: () => {}
    };
    // Any GL enum/method not explicitly defined resolves inertly.
    return new Proxy(gl, {
        get: (t, p) =>
        {
            if (p in t) return t[p];
            if (typeof p === "string" && /^[A-Z0-9_]+$/.test(p)) return 1;
            return () => ({});
        }
    });
    function hashLoc(name) { let h = 0; for (let i = 0; i < String(name).length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff; return h; }
}

// --------------------------------------------------------------------------
// Package resolution
// --------------------------------------------------------------------------
function resolvePackage(name)
{
    if (!name) return null;
    // Optional synthetic-package cache dir. Defaults to a sibling ccpwgl2-server
    // checkout if present; override with CCPWGL_SYNTHETIC_CACHE. No machine-
    // specific absolute path is baked in.
    const syntheticDir = process.env.CCPWGL_SYNTHETIC_CACHE
        || path.join(__dirname, "..", "..", "..", "ccpwgl2-server", "public", "cache", "synthetic");
    const candidates = [
        name,
        path.resolve(name),
        path.join(__dirname, "..", "..", "test", "fixtures", name),
        path.join(syntheticDir, name)
    ];
    for (const c of candidates) { try { if (fs.statSync(c).isFile()) return c; } catch (e) { /* next */ } }
    return null;
}

// --------------------------------------------------------------------------
// Diagnostics collection
// --------------------------------------------------------------------------
function usageName(el)
{
    // Tw2VertexElement has a `string` getter (usage enum -> name)
    try { if (el.string) return el.string; } catch (e) { /* fall through */ }
    return String(el.usage);
}

function collectStage(stage, args)
{
    const out = {
        stageName: stage.string || (stage.type === 0 ? "vertex" : stage.type === 1 ? "pixel" : String(stage.type)),
        isCewg: !!stage.isCewg,
        constantSize: stage.constantSize,
        inputs: [],
        constants: [],
        textures: [],
        samplers: [],
        cewgBindings: null
    };

    const elements = (stage.inputDefinition && stage.inputDefinition.elements) || [];
    for (const el of elements)
    {
        out.inputs.push({
            usage: el.usage,
            usageName: usageName(el),
            usageIndex: el.usageIndex,
            attr: el._attr || null,
            registerIndex: el._registerIndex != null ? el._registerIndex : el.registerIndex,
            offsetFloats: typeof el.offset === "number" ? el.offset / 4 : null,
            elements: el.elements != null ? el.elements : null,
            usedMask: el.usedMask
        });
    }

    for (const c of stage.constants || [])
    {
        out.constants.push({
            name: c.name,
            registerFloatOffset: c.offset,
            register: typeof c.offset === "number" ? Math.floor(c.offset / 4) : null,
            size: c.size,
            dimension: c.dimension,
            elements: c.elements,
            isSRGB: c.isSRGB,
            isAutoregister: c.isAutoregister
        });
    }

    for (const t of stage.textures || [])
    {
        out.textures.push({ register: t.registerIndex, name: t.name, isAutoregister: t.isAutoregister });
    }
    for (const s of stage.samplers || [])
    {
        out.samplers.push({ register: s.registerIndex, name: s.name });
    }

    if (Array.isArray(stage.cewgBindings))
    {
        // Binding shape varies (structuredUbo / bufferTexture / constantBuffer /
        // bone). Keep every field so nothing is silently dropped, and surface a
        // register from whichever key it lives under.
        out.cewgBindings = stage.cewgBindings.map(b => ({
            ...b,
            register: b.register != null ? b.register : (b.registerIndex != null ? b.registerIndex : b.bindingPoint)
        }));
    }

    if (args.glsl) out.glsl = stage.shaderCode || "";
    else if (args.glslLines > 0) out.glslHead = (stage.shaderCode || "").split("\n").slice(0, args.glslLines).join("\n");

    return out;
}

function collectPacking(tw2, res)
{
    // Run CewgCarbonData packing on synthetic, provenance-stamped GLES input so
    // each output register's source is identifiable (reg N.x == 100+N).
    let carbon;
    try { carbon = require("../../src/core/cewg/CewgCarbonData.js"); } catch (e) { return { error: String(e) }; }

    const FL = 4;
    function stamp(regs) { const a = new Float32Array(regs * FL); for (let r = 0; r < regs; r++) for (let c = 0; c < FL; c++) a[r * FL + c] = 100 + r + c / 10; return a; }

    function dump(out, regs, label)
    {
        const rows = [];
        for (let r = 0; r < regs; r++)
        {
            const v = [ out[r * FL], out[r * FL + 1], out[r * FL + 2], out[r * FL + 3] ];
            const zero = v.every(x => x === 0);
            // provenance: a value of 100+src.r + src.c/10 tells us which gles reg/col it came from
            const src = v.map(x => (x >= 100 && x < 100 + 512) ? `g${Math.round((x - 100) * 10) / 10}` : (x === 0 ? "0" : x.toFixed(2)));
            rows.push({ reg: r, zeroed: zero, values: src });
        }
        return { label, regs, rows };
    }

    const result = {};
    try
    {
        const glesVs = stamp(60);
        const perFrameVs = new Float32Array(carbon.PER_FRAME_VS_REGS * FL);
        carbon.PackPerFrameVS(perFrameVs, glesVs);
        result.b1_perFrameVS = dump(perFrameVs, carbon.PER_FRAME_VS_REGS, "b1 per-frame VS");
    } catch (e) { result.b1_error = String(e); }
    try
    {
        const glesPs = stamp(60);
        const perFramePs = new Float32Array(carbon.PER_FRAME_PS_REGS * FL);
        carbon.PackPerFramePS(perFramePs, glesPs);
        result.b2_perFramePS = dump(perFramePs, Math.min(carbon.PER_FRAME_PS_REGS, 30), "b2 per-frame PS (first 30 regs)");
    } catch (e) { result.b2_error = String(e); }
    try
    {
        const glesVs = stamp(60);
        const perObjVs = new Float32Array(carbon.PER_OBJECT_REGS * FL);
        carbon.PackPerObjectVS(perObjVs, glesVs);
        result.b3_perObjectVS = dump(perObjVs, carbon.PER_OBJECT_REGS, "b3 per-object VS");
    } catch (e) { result.b3_error = String(e); }
    try
    {
        const glesVs = stamp(60), glesPs = stamp(60);
        const perObjPs = new Float32Array(carbon.PER_OBJECT_REGS * FL);
        carbon.PackPerObjectPS(perObjPs, glesVs, glesPs);
        result.b4_perObjectPS = dump(perObjPs, carbon.PER_OBJECT_REGS, "b4 per-object PS");
    } catch (e) { result.b4_error = String(e); }
    return result;
}

function collectMesh(meshPath, verts)
{
    // Decode a .gr2 through CjsFormatGr2 (ccpwgl's dependency) and report the
    // vertex declaration + sample vertices both ways.
    let CjsFormatGr2;
    try
    {
        const mod = require("@carbonenginejs/format-gr2");
        CjsFormatGr2 = mod.default || mod.CjsFormatGr2 || mod;
    }
    catch (e) { return { error: `format-gr2 not resolvable: ${e}` }; }
    if (typeof CjsFormatGr2.read !== "function") return { error: "CjsFormatGr2.read not found (export interop)" };
    let bytes;
    try { bytes = fs.readFileSync(meshPath); } catch (e) { return { error: `cannot read mesh: ${e}` }; }

    let json;
    try { json = CjsFormatGr2.read(bytes, { emit: "json", unpackTangents: true }); }
    catch (e) { return { error: `gr2 read failed: ${e}` }; }

    const mesh = json.meshes && json.meshes[0];
    if (!mesh || !mesh.vertex) return { error: "no mesh[0].vertex in gr2" };

    const n = (mesh.vertex.position && mesh.vertex.position.length / 3) || 0;
    const channels = {};
    for (const key of Object.keys(mesh.vertex))
    {
        const data = mesh.vertex[key];
        if (!data || !data.length) continue;
        const width = n ? data.length / n : 0;
        const sampleF = [], sampleI = [];
        for (let v = 0; v < Math.min(verts, n); v++)
        {
            const row = [];
            const rowI = [];
            for (let c = 0; c < width; c++)
            {
                const f = data[v * width + c];
                row.push(Number.isFinite(f) ? +f.toFixed(4) : f);
                // int bit pattern of the float
                const buf = new ArrayBuffer(4); new Float32Array(buf)[0] = f; rowI.push(new Int32Array(buf)[0]);
            }
            sampleF.push(row);
            sampleI.push(rowI);
        }
        channels[key] = { width, asFloat: sampleF, asIntBits: sampleI };
    }
    return { vertexCount: n, channels };
}

// --------------------------------------------------------------------------
// Text rendering
// --------------------------------------------------------------------------
function section(title) { return `\n${"=".repeat(70)}\n${title}\n${"=".repeat(70)}`; }

function renderText(doc)
{
    const L = [];
    L.push(section("PACKAGE"));
    L.push(`file:        ${doc.package.file}`);
    L.push(`version:     ${doc.package.version}`);
    L.push(`sourcePath:  ${doc.package.sourcePath || "(n/a)"}`);
    L.push(`techniques:  ${doc.package.techniques.join(", ")}`);
    L.push("permutations:");
    for (const p of doc.package.permutations)
    {
        L.push(`  ${p.name.padEnd(34)} default=${p.default}  [${p.options.join(", ")}]`);
    }
    if (Object.keys(doc.resolvedOptions).length)
    {
        L.push(`applied options: ${JSON.stringify(doc.resolvedOptions)}`);
    }

    for (const tech of doc.techniques)
    {
        L.push(section(`TECHNIQUE: ${tech.name}`));
        tech.passes.forEach((pass, pi) =>
        {
            L.push(`pass ${pi}  isCewg=${pass.isCewg}  stages=${pass.stages.length}`);
            for (const st of pass.stages)
            {
                L.push(`  --- ${st.stageName} stage ---`);
                if (st.inputs.length)
                {
                    L.push(`  vertex inputs (usage -> attr):`);
                    for (const inp of st.inputs)
                    {
                        const extra = inp.elements != null ? ` elems=${inp.elements}` : (inp.usedMask != null ? ` mask=0x${inp.usedMask.toString(16)}` : "");
                        L.push(`    usage ${String(inp.usage).padStart(2)} ${String(inp.usageName).padEnd(13)} idx${inp.usageIndex}  ${String(inp.attr || "").padEnd(16)} reg=${inp.registerIndex}${extra}`);
                    }
                }
                if (st.textures.length)
                {
                    L.push(`  textures (register -> name [sampler]):`);
                    st.textures.forEach((t, i) =>
                    {
                        const smp = st.samplers[i] ? ` [${st.samplers[i].name}]` : "";
                        L.push(`    s${t.register} = ${t.name}${smp}`);
                    });
                }
                if (st.constants.length)
                {
                    L.push(`  constants (register: name):`);
                    for (const c of st.constants)
                    {
                        L.push(`    cb[${String(c.register).padStart(2)}] ${c.name}  (size ${c.size}${c.isSRGB ? ", sRGB" : ""})`);
                    }
                }
                if (st.cewgBindings && st.cewgBindings.length)
                {
                    L.push(`  cewgBindings: ${st.cewgBindings.map(b => `${b.kind}${b.register != null ? "@" + b.register : ""}${b.name ? "(" + b.name + ")" : ""}`).join(", ")}`);
                }
                if (st.glslHead) { L.push(`  glsl (first lines):`); L.push(st.glslHead.split("\n").map(l => "    " + l).join("\n")); }
                if (st.glsl) { L.push(`  glsl:`); L.push(st.glsl.split("\n").map(l => "    " + l).join("\n")); }
            }
        });
    }

    if (doc.packing)
    {
        L.push(section("CONSTANT PACKING (CewgCarbonData b1-b4)"));
        L.push("(gN.C = value came from GLES register N column C; '0' = zeroed/synthesised)");
        for (const key of Object.keys(doc.packing))
        {
            const blk = doc.packing[key];
            if (!blk || !blk.rows) { L.push(`${key}: ${JSON.stringify(blk)}`); continue; }
            L.push(`\n${blk.label} (${blk.regs} regs):`);
            for (const r of blk.rows)
            {
                L.push(`  reg ${String(r.reg).padStart(3)} ${r.zeroed ? "[ZERO]" : "      "} [${r.values.join(", ")}]`);
            }
        }
    }

    if (doc.mesh)
    {
        L.push(section(`MESH: ${doc.mesh.path}`));
        if (doc.mesh.error) { L.push(`error: ${doc.mesh.error}`); }
        else
        {
            L.push(`vertexCount: ${doc.mesh.vertexCount}`);
            for (const key of Object.keys(doc.mesh.channels))
            {
                const ch = doc.mesh.channels[key];
                L.push(`  channel ${key.padEnd(14)} width=${ch.width}`);
                L.push(`    asFloat:  ${JSON.stringify(ch.asFloat)}`);
                L.push(`    asIntBits:${JSON.stringify(ch.asIntBits)}`);
            }
        }
    }

    if (doc.apply)
    {
        L.push(section("RECORDED APPLYPASS (GL activity)"));
        if (doc.apply.error)
        {
            L.push(`best-effort (not available): ${doc.apply.error}`);
            L.push("(ApplyPass needs a fully-linked program the stub can't fake; the binding");
            L.push(" manifest is available statically above - see per-stage cewgBindings + textures.)");
        }
        else
        {
            L.push(`technique/pass: ${doc.apply.technique}/${doc.apply.pass}`);
            L.push(`call summary: ${JSON.stringify(doc.apply.summary)}`);
            L.push("attribute bindings (getAttribLocation): " + doc.apply.attribs.join(", "));
            L.push("uniform-block bindings (getUniformBlockIndex): " + doc.apply.uniformBlocks.join(", "));
            L.push("uniform4fv uploads: " + doc.apply.uniform4fv.map(u => `${u.loc}(${u.len})`).join(", "));
            L.push("texture-unit binds (activeTexture->bindTexture): " + doc.apply.textureUnits.join(", "));
        }
    }

    return L.join("\n");
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
function main()
{
    const args = parseArgs(process.argv.slice(2));
    if (args.help || !args.package)
    {
        console.log("usage: node scripts/testbed/cewg-diagnostics.js <package.cewg> [--options k=v,...] [--technique NAME] [--glsl|--glsl-lines N] [--mesh file.gr2] [--apply] [--json]");
        process.exit(args.help ? 0 : 1);
    }

    const pkgPath = resolvePackage(args.package);
    if (!pkgPath) { console.error(`package not found: ${args.package}`); process.exit(1); }

    installShims();
    const { tw2 } = require("../../dist/ccpwgl2_int.js");
    Object.defineProperty(tw2.device, "gl", { value: makeInertGl(), configurable: true, writable: true });

    const Tw2EffectRes = tw2.GetClass("Tw2EffectRes");
    const bytes = fs.readFileSync(pkgPath);
    const res = new Tw2EffectRes();
    res.path = `testbed:/${path.basename(pkgPath)}`;
    res._extension = "cewg";
    res.Prepare(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    if (res._error) { console.error(`prepare failed: ${res._error}`); process.exit(1); }

    const shader = res.GetShader(args.options);
    if (!shader) { console.error("GetShader returned null (check --options against the permutation list)"); process.exit(1); }

    const doc = {
        package: {
            file: pkgPath,
            version: res.version,
            sourcePath: (res._cewg && res._cewg.info && res._cewg.info.sourcePath) || null,
            techniques: Object.keys(shader.techniques),
            permutations: (res.permutations || []).map(p => ({
                name: p.name,
                options: Array.isArray(p.options) ? p.options : Object.keys(p.options),
                default: (Array.isArray(p.options) ? p.options : Object.keys(p.options))[p.defaultOption || 0]
            }))
        },
        resolvedOptions: args.options,
        techniques: []
    };

    for (const techName of Object.keys(shader.techniques))
    {
        if (args.technique && techName !== args.technique) continue;
        const tech = shader.techniques[techName];
        const passes = (tech.passes || []).map(pass => ({
            isCewg: !!pass.isCewg,
            stages: (pass.stages || []).map(st => collectStage(st, args))
        }));
        doc.techniques.push({ name: techName, passes });
    }

    doc.packing = collectPacking(tw2, res);

    if (args.mesh)
    {
        const meshPath = fs.existsSync(args.mesh) ? args.mesh : path.resolve(args.mesh);
        doc.mesh = { path: meshPath, ...collectMesh(meshPath, args.meshVerts) };
    }

    if (args.apply) doc.apply = runApply(tw2, res, shader, args);

    if (args.json) console.log(JSON.stringify(doc, null, 2));
    else console.log(renderText(doc));
}

/**
 * Builds a minimal Tw2Effect around the loaded shader and records a real
 * ApplyPass through a recording GL stub, then summarises the GL activity.
 */
function runApply(tw2, res, shader, args)
{
    try
    {
        const gl = makeRecordingGl();
        Object.defineProperty(tw2.device, "gl", { value: gl, configurable: true, writable: true });

        const Tw2Effect = tw2.GetClass("Tw2Effect");
        const effect = new Tw2Effect();
        effect.effectRes = res;
        effect.shader = shader;

        const techName = args.technique && shader.techniques[args.technique] ? args.technique
            : (shader.techniques.Main ? "Main" : Object.keys(shader.techniques)[0]);

        // Rebuild bound pass-state so ApplyPass has effect.techniques populated
        effect.autoParameter = true;
        try { effect.BindParameters(); } catch (e) { /* best effort */ }

        try { effect.ApplyPass(techName, 0); } catch (e) { return { error: `ApplyPass threw: ${e}`, technique: techName, pass: 0 }; }

        const calls = gl.calls;
        const summary = {};
        for (const c of calls) summary[c[0]] = (summary[c[0]] || 0) + 1;

        const textureUnits = [];
        let curUnit = null;
        for (const c of calls)
        {
            if (c[0] === "activeTexture") curUnit = c[1];
            else if (c[0] === "bindTexture" && curUnit !== null) textureUnits.push(`unit${curUnit}=${c[2]}`);
        }

        return {
            technique: techName,
            pass: 0,
            summary,
            attribs: calls.filter(c => c[0] === "getAttribLocation").map(c => c[1]),
            uniformBlocks: calls.filter(c => c[0] === "getUniformBlockIndex").map(c => c[1]),
            uniform4fv: calls.filter(c => c[0] === "uniform4fv").map(c => ({ loc: c[1], len: c[2] })),
            textureUnits
        };
    }
    catch (e) { return { error: String(e) }; }
}

main();
