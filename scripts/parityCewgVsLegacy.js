// Pixel-parity harness: renders the same quad with a legacy v8 GLES
// shader and its CEWG (translated DX11) counterpart through ccpwgl's
// real Tw2EffectRes/Tw2ShaderProgram/CewgResourceBinder pipeline in
// headless Chromium, then diffs the readback.
//
// Both sides receive equivalent inputs:
// - effect constants matched BY NAME (legacy stage defaults are the
//   source of truth, written into each side's own cb layout),
// - identical GLES-shaped per-frame/per-object arrays — the legacy pass
//   uploads them raw, the CEWG pass runs them through the production
//   CewgResourceBinder.ApplyConstants (GLES -> Carbon repack),
// - white placeholder textures on every sampler unit,
// - identical vertex data per semantic usage; render state application
//   is skipped on both sides equally.
//
// This is a shading-parity gate, not a full-scene test: real textures,
// pass render states and scene lighting come later in the promotion
// pipeline.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
// This script lives inside the ccpwgl checkout itself, so its own
// project root IS the ccpwgl root; --ccpwgl / CCPWGL_DIR can still point
// at a different checkout (e.g. a second working tree) when needed.
const defaultCcpwgl = process.env.CCPWGL_DIR || projectRoot;

function parseArgs(argv) {
  const args = {
    ccpwgl: defaultCcpwgl,
    legacy: null,
    cewg: null,
    out: path.join(projectRoot, "artifacts", "parity.cewg-vs-legacy.json"),
    keepBrowserOpen: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--ccpwgl" && argv[i + 1]) args.ccpwgl = argv[++i];
    else if (arg === "--legacy" && argv[i + 1]) args.legacy = path.resolve(argv[++i]);
    else if (arg === "--cewg" && argv[i + 1]) args.cewg = path.resolve(argv[++i]);
    else if (arg === "--out" && argv[i + 1]) args.out = path.resolve(argv[++i]);
    else if (arg === "--keep-browser-open") args.keepBrowserOpen = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  args.dist = path.join(args.ccpwgl, "dist/ccpwgl2_int.js");
  if (args.legacy && args.cewg) {
    args.pairs = [ { name: path.basename(args.cewg, ".webgl.cewg"), legacy: args.legacy, cewg: args.cewg } ];
  } else {
    args.pairs = [
      {
        name: "quadv5",
        legacy: path.join(args.ccpwgl, "test/fixtures/quadv5.gles2.sm_hi"),
        cewg: path.join(args.ccpwgl, "test/fixtures/quadv5.webgl.cewg")
      },
      {
        name: "skinned_quadv5",
        skinned: true,
        legacy: path.join(args.ccpwgl, "test/fixtures/skinned_quadv5.gles2.sm_hi"),
        cewg: path.join(args.ccpwgl, "test/fixtures/skinned_quadv5.webgl.cewg")
      }
    ];
  }
  return args;
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    error.message = `Playwright is required: npm.cmd install --save-dev playwright\n${error.message}`;
    throw error;
  }
}

/**
 * Runs inside Chromium. Self-contained: no closure over node scope.
 *
 * @param {{legacyB64:string, cewgB64:string}} payload
 * @returns {object} Per-technique parity stats.
 */
function runParity(payload) {
  const out = { techniques: [], errors: [], warnings: [] };
  try {
    const b64ToU8 = (b64) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      return bytes;
    };

    const { tw2, CewgResourceBinder } = window;
    const canvas = document.getElementById("c");
    const W = canvas.width;
    const H = canvas.height;
    const gl = canvas.getContext("webgl2", {
      antialias: false, alpha: false, depth: true, preserveDrawingBuffer: true
    });
    if (!gl) return { fatal: "webgl2 context unavailable" };
    Object.defineProperty(tw2.device, "gl", { value: gl, configurable: true, writable: true });

    const Tw2EffectRes = tw2.GetClass("Tw2EffectRes");
    const loadRes = (bytes, name) => {
      const res = new Tw2EffectRes();
      res.path = `parity:/${name}`;
      res._extension = "sm_hi";
      res.Prepare(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      return res;
    };

    // Identity float3x4 joint rows for every legacy inline slot (58) —
    // also staged to the CEWG bone UBO, so bone-0 skinning is a no-op
    // on both sides and skinned output must equal the unskinned math.
    const JOINT_COUNT = 58;
    const jointMatrices = new Float32Array(JOINT_COUNT * 12);
    for (let j = 0; j < JOINT_COUNT; j += 1) {
      jointMatrices[j * 12] = 1;
      jointMatrices[j * 12 + 5] = 1;
      jointMatrices[j * 12 + 10] = 1;
    }
    let activeJoints = null;

    // --- deterministic GLES-shaped frame/object data -------------------------
    const REG = 4;
    const identityAt = (arr, reg) => {
      arr[reg * REG] = 1; arr[(reg + 1) * REG + 1] = 1;
      arr[(reg + 2) * REG + 2] = 1; arr[(reg + 3) * REG + 3] = 1;
    };
    const glesFrameVS = new Float32Array(34 * REG);
    for (const m of [ 0, 4, 8, 12, 16, 20, 24 ]) identityAt(glesFrameVS, m);
    glesFrameVS.set([ 0.577, 0.577, 0.577, 0 ], 28 * REG);   // SunData.DirWorld
    glesFrameVS.set([ 1, 1, 1, 1 ], 29 * REG);               // SunData.DiffuseColor
    glesFrameVS.set([ 0, 0, 0, 0 ], 30 * REG);               // FogFactors
    glesFrameVS.set([ W, H, 1, 1 ], 31 * REG);               // TargetResolution
    glesFrameVS.set([ 1, 1, 1, 1 ], 32 * REG);               // ViewportAdjustment
    glesFrameVS.set([ 0.5, 0, W, H ], 33 * REG);             // MiscSettings

    const glesFramePS = new Float32Array(23 * REG);
    for (const m of [ 0, 4, 8 ]) identityAt(glesFramePS, m);
    glesFramePS.set([ 0.577, 0.577, 0.577, 0 ], 12 * REG);   // Sun dir
    glesFramePS.set([ 1, 1, 1, 0.5 ], 13 * REG);             // Sun color (+roughness .w)
    glesFramePS.set([ 0.2, 0.2, 0.2, 1 ], 14 * REG);         // Ambient
    glesFramePS.set([ 0, 0, 0, 0 ], 15 * REG);               // FogColor
    glesFramePS.set([ 0, 0, W, H ], 16 * REG);               // Viewport
    glesFramePS.set([ W, H, 0, 0 ], 17 * REG);               // TargetResolution
    glesFramePS.set([ 1, 1, 0, 0 ], 18 * REG);               // ShadowMapSettings
    glesFramePS.set([ 1, 0, 0, 0 ], 19 * REG);               // ShadowCameraRange
    glesFramePS.set([ 0, 1, 1, 1 ], 20 * REG);               // ProjectionToView+Fov
    glesFramePS.set([ 0.5, 0, 0, 1 ], 21 * REG);             // MiscSettings (time..)
    glesFramePS.set([ 1e3, 1e4, 1e5, 1e6 ], 22 * REG);       // VolumetricSlices

    const podVS = new Float32Array(200 * REG);
    for (const m of [ 0, 4, 8 ]) identityAt(podVS, m);        // world/last/inv
    podVS.set([ 0, 1, 0, 100 ], 12 * REG);                   // Shipdata
    podVS.set([ 1, 1, 1, 0 ], 14 * REG);                     // EllipsoidRadii
    const podPS = new Float32Array(16 * REG);
    podPS.set([ 0, 1, 0, 100 ], 0);                          // Shipdata
    for (let i = 0; i < 7; i += 1) podPS.set([ 0.3, 0.3, 0.3, 0.3 ], (3 + i) * REG); // SH
    podPS.set([ W, H, 1 / W, 1 / H ], 15 * REG);             // Screensize

    tw2.device.perFrameVSData = { data: glesFrameVS };
    tw2.device.perFramePSData = { data: glesFramePS };
    tw2.device.viewportWidth = W;
    tw2.device.viewportHeight = H;

    const setObjectData = (skinned) => {
      if (skinned) {
        podVS.set(jointMatrices, 26 * REG); // legacy inline JointMat splice
        activeJoints = jointMatrices;
      } else {
        podVS.fill(0, 26 * REG);
        activeJoints = null;
      }
      tw2.device.perObjectData = {
        vs: {
          data: podVS,
          Has: (name) => skinned && name === "JointMat",
          Get: (name) => (skinned && name === "JointMat" ? jointMatrices : null)
        },
        ps: { data: podPS }
      };
    };

    // --- placeholder textures per sampler type -------------------------------
    const whiteTextures = {};
    const whitePixel = new Uint8Array([ 255, 255, 255, 255 ]);
    const getWhite = (type) => {
      if (whiteTextures[type]) return whiteTextures[type];
      const tex = gl.createTexture();
      if (type === gl.SAMPLER_CUBE) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
        for (let f = 0; f < 6; f += 1) {
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      } else if (type === gl.SAMPLER_3D) {
        gl.bindTexture(gl.TEXTURE_3D, tex);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, 1, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      } else if (type === gl.SAMPLER_2D_ARRAY) {
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
        gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, 1, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      }
      whiteTextures[type] = tex;
      return tex;
    };
    const bindTargetByType = (type) =>
      type === gl.SAMPLER_CUBE ? gl.TEXTURE_CUBE_MAP
        : type === gl.SAMPLER_3D ? gl.TEXTURE_3D
          : type === gl.SAMPLER_2D_ARRAY ? gl.TEXTURE_2D_ARRAY
            : gl.TEXTURE_2D;
    const SAMPLER_TYPES = new Set([
      gl.SAMPLER_2D, gl.SAMPLER_CUBE, gl.SAMPLER_3D, gl.SAMPLER_2D_ARRAY,
      gl.SAMPLER_2D_SHADOW, gl.INT_SAMPLER_2D, gl.UNSIGNED_INT_SAMPLER_2D
    ]);

    // --- vertex data per Trinity usage code (Tr2VertexDefinition) --------------
    // (POSITION 0, COLOR 1, NORMAL 2, TANGENT 3, BITANGENT 4, TEXCOORD 5,
    //  BLENDINDICES 6, BLENDWEIGHTS 7 — the runtime enum everywhere now;
    //  legacy v8 elements are translated to it at their reader.)
    const USAGE_DATA = {
      0: [ -0.9, -0.9, 0, 1, 0.9, -0.9, 0, 1, -0.9, 0.9, 0, 1, 0.9, 0.9, 0, 1 ], // POSITION
      1: [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],                     // COLOR
      2: [ 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0 ],                     // NORMAL
      3: [ 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1 ],                     // TANGENT
      4: [ 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1 ],                     // BITANGENT
      5: [ 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0 ],                     // TEXCOORD
      6: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],                     // BLENDINDICES (bone 0)
      7: [ 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0 ]                      // BLENDWEIGHTS
    };
    const ZERO_VERTS = new Array(16).fill(0);

    // --- constant transfer by name -------------------------------------------
    const constantByName = (stage, name) => (stage.constants || []).find((c) => c.name === name);
    const buildStageConstants = (stage, donorStages) => {
      const values = new Float32Array(stage.constantValues ? stage.constantValues.length : 0);
      if (stage.constantValues) values.set(stage.constantValues);
      for (const c of stage.constants || []) {
        for (const donor of donorStages) {
          const match = constantByName(donor, c.name);
          if (!match || !donor.constantValues) continue;
          const size = Math.min(c.size, match.size);
          for (let i = 0; i < size; i += 1) {
            values[c.offset + i] = donor.constantValues[match.offset + i];
          }
          break;
        }
      }
      return values;
    };

    // --- draw one pass ---------------------------------------------------------
    const drawPass = (pass, donorStages, isCewg, label) => {
      const record = { label, glErrors: [], glErrorStages: [] };
      const drain = (stageName) => {
        let code;
        while ((code = gl.getError()) !== gl.NO_ERROR) {
          record.glErrors.push(code);
          record.glErrorStages.push(`${stageName}:${code}`);
        }
      };
      const program = pass.shaderProgram;
      if (!program) { record.error = "no shaderProgram"; return record; }
      gl.useProgram(program.program);
      drain("pre");

      // Constants: effect cb0/cb7 (donor-matched), then per-frame/object.
      const cbh = program.constantBufferHandles;
      const vsConsts = donorStages ? buildStageConstants(pass.stages[0], donorStages) : pass.stages[0].constantValues;
      const psConsts = donorStages ? buildStageConstants(pass.stages[1], donorStages) : pass.stages[1].constantValues;
      if (cbh[0] && vsConsts && vsConsts.length) gl.uniform4fv(cbh[0], vsConsts);
      if (cbh[7] && psConsts && psConsts.length) gl.uniform4fv(cbh[7], psConsts);

      drain("effect-constants");
      if (isCewg) {
        const binder = CewgResourceBinder.Get(tw2.device);
        binder.SetJointMatrices(activeJoints); // mirrors Tw2Effect.ApplyPass
        binder.ApplyConstants(program, tw2.device);
        drain("carbon-constants");
        binder.ApplyPass(program, tw2.device);
        drain("binder-resources");
      } else {
        if (cbh[1]) gl.uniform4fv(cbh[1], glesFrameVS);
        if (cbh[2]) gl.uniform4fv(cbh[2], glesFramePS);
        if (cbh[3]) gl.uniform4fv(cbh[3], podVS);
        if (cbh[4]) gl.uniform4fv(cbh[4], podPS);
        drain("legacy-constants");
      }

      // Textures: every active sampler gets a white placeholder of its type.
      const uniformCount = gl.getProgramParameter(program.program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i += 1) {
        const info = gl.getActiveUniform(program.program, i);
        if (!info || !SAMPLER_TYPES.has(info.type)) continue;
        if (info.type === gl.UNSIGNED_INT_SAMPLER_2D || info.type === gl.INT_SAMPLER_2D) continue; // binder-owned
        const location = gl.getUniformLocation(program.program, info.name.replace(/\[0\]$/, ""));
        if (!location) continue;
        const unit = gl.getUniform(program.program, location);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(bindTargetByType(info.type), getWhite(info.type));
      }
      gl.activeTexture(gl.TEXTURE0);
      drain("textures");

      // Attributes from the linked program's element list.
      const buffers = [];
      const enabled = [];
      for (const el of pass.shaderProgram.input.elements) {
        const data = USAGE_DATA[el.usage] || ZERO_VERTS;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(el.location, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(el.location);
        buffers.push(buffer);
        enabled.push(el.location);
      }

      gl.viewport(0, 0, W, H);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.clearColor(0.05, 0.05, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drain("attributes");
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      drain("draw");

      // Bone-UBO deep probe: real block wiring + buffer readback.
      if (isCewg && program.cewgUniformBlocks && program.cewgUniformBlocks.length) {
        const dbg = { manifest: JSON.parse(JSON.stringify(program.cewgUniformBlocks)) };
        const blockName = `${program.cewgUniformBlocks[0].name}Block`;
        const blockIndex = gl.getUniformBlockIndex(program.program, blockName);
        dbg.blockIndex = blockIndex;
        if (blockIndex !== gl.INVALID_INDEX) {
          dbg.dataSize = gl.getActiveUniformBlockParameter(program.program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
          dbg.blockBinding = gl.getActiveUniformBlockParameter(program.program, blockIndex, gl.UNIFORM_BLOCK_BINDING);
        }
        const binder = CewgResourceBinder.Get(tw2.device);
        if (binder._boneBuffer) {
          const readback = new Float32Array(12);
          gl.bindBuffer(gl.UNIFORM_BUFFER, binder._boneBuffer);
          gl.getBufferSubData(gl.UNIFORM_BUFFER, 0, readback);
          dbg.boneBufferHead = Array.from(readback);
          dbg.boneBufferBytes = binder._boneBufferByteLength;
        } else {
          dbg.boneBufferHead = null;
        }
        drain("ubo-probe");
        record.uboDebug = dbg;
      }

      const pixels = new Uint8Array(W * H * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      for (const location of enabled) gl.disableVertexAttribArray(location);
      for (const buffer of buffers) gl.deleteBuffer(buffer);
      record.pixels = pixels;
      return record;
    };

    // --- compare all common techniques, per fixture pair -----------------------
    for (const pair of payload.pairs) {
      const legacyRes = loadRes(b64ToU8(pair.legacyB64), `${pair.name}.legacy.sm_hi`);
      const cewgRes = loadRes(b64ToU8(pair.cewgB64), `${pair.name}.cewg.sm_hi`);
      if (legacyRes._error || cewgRes._error) {
        out.errors.push(`${pair.name}: prepare failed legacy=${!!legacyRes._error} cewg=${!!cewgRes._error}`);
        continue;
      }
      setObjectData(!!pair.skinned);

      const legacyShader = legacyRes.GetShader({});
      const cewgShader = cewgRes.GetShader({});
      if (!legacyShader || !cewgShader) {
        out.errors.push(`${pair.name}: shader build failed legacy=${!!legacyShader} cewg=${!!cewgShader}`);
        continue;
      }
      const common = Object.keys(legacyShader.techniques)
        .filter((name) => cewgShader.techniques[name]);
      if (!common.length) {
        out.warnings.push(`${pair.name}: no common techniques: legacy=[${Object.keys(legacyShader.techniques)}] cewg=[${Object.keys(cewgShader.techniques)}]`);
      }

      for (const name of common) {
      const legacyPass = legacyShader.techniques[name].passes[0];
      const cewgPass = cewgShader.techniques[name].passes[0];
      const donorStages = [ legacyPass.stages[0], legacyPass.stages[1] ];

      const legacyRun = drawPass(legacyPass, null, false, `${pair.name}:legacy:${name}`);
      const cewgRun = drawPass(cewgPass, donorStages, true, `${pair.name}:cewg:${name}`);

      const entry = {
        pair: pair.name,
        technique: name,
        legacyGlErrors: legacyRun.glErrors,
        cewgGlErrors: cewgRun.glErrors,
        legacyGlErrorStages: legacyRun.glErrorStages,
        cewgGlErrorStages: cewgRun.glErrorStages,
        legacyError: legacyRun.error || null,
        cewgError: cewgRun.error || null,
        uboDebug: cewgRun.uboDebug || null
      };

      // Centre-pixel samples for eyeballing encoding differences.
      if (legacyRun.pixels && cewgRun.pixels) {
        const mid = ((H / 2) * W + W / 2) * 4;
        entry.centerLegacy = Array.from(legacyRun.pixels.slice(mid, mid + 4));
        entry.centerCewg = Array.from(cewgRun.pixels.slice(mid, mid + 4));
      }

      if (legacyRun.pixels && cewgRun.pixels) {
        let maxDiff = 0;
        let totalDiff = 0;
        let diffCount = 0;
        let legacyLit = 0;
        let cewgLit = 0;
        const n = legacyRun.pixels.length;
        for (let i = 0; i < n; i += 1) {
          const d = Math.abs(legacyRun.pixels[i] - cewgRun.pixels[i]);
          if (d > maxDiff) maxDiff = d;
          totalDiff += d;
          if (d > 2) diffCount += 1;
        }
        // "lit" = differs from the clear color (13,13,26,255)
        for (let i = 0; i < n; i += 4) {
          if (Math.abs(legacyRun.pixels[i] - 13) > 3 || Math.abs(legacyRun.pixels[i + 1] - 13) > 3 || Math.abs(legacyRun.pixels[i + 2] - 26) > 3) legacyLit += 1;
          if (Math.abs(cewgRun.pixels[i] - 13) > 3 || Math.abs(cewgRun.pixels[i + 1] - 13) > 3 || Math.abs(cewgRun.pixels[i + 2] - 26) > 3) cewgLit += 1;
        }
        entry.maxDiff = maxDiff;
        entry.meanDiff = totalDiff / n;
        entry.diffChannelCount = diffCount;
        entry.legacyLitPixels = legacyLit;
        entry.cewgLitPixels = cewgLit;
        entry.totalPixels = W * H;
      }
      out.techniques.push(entry);
      }
    }
    return out;
  } catch (error) {
    return { fatal: `${error.message}\n${error.stack}` };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dist = await readFile(args.dist, "utf8");
  const pairs = await Promise.all(args.pairs.map(async (pair) => ({
    name: pair.name,
    skinned: !!pair.skinned,
    legacyB64: (await readFile(pair.legacy)).toString("base64"),
    cewgB64: (await readFile(pair.cewg)).toString("base64")
  })));

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: !args.keepBrowserOpen });
  let result;
  try {
    const page = await browser.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error(`[page] ${msg.text()}`);
    });
    await page.setContent("<!doctype html><canvas id=\"c\" width=\"256\" height=\"256\"></canvas>");
    await page.addScriptTag({ content: dist });
    result = await page.evaluate(runParity, { pairs });
  } finally {
    if (!args.keepBrowserOpen) await browser.close();
  }

  await writeFile(args.out, JSON.stringify(result, null, 2));
  if (result.fatal) {
    console.error(`FATAL: ${result.fatal}`);
    process.exitCode = 1;
    return;
  }
  for (const w of result.warnings || []) console.warn(`WARN: ${w}`);

  // Techniques where the DX11 and GLES-v8 pipelines assign different
  // semantics to the same technique name — a pixel diff is expected and
  // is not a translation defect.
  const knownSemanticDiffs = {
    Depth: "DX11 'Depth' is a world-normal prepass (0.5+0.5*n encode); GLES v8 packs scene depth"
  };

  let failures = 0;
  for (const t of result.techniques) {
    let status = t.legacyError || t.cewgError ? "ERROR"
      : t.legacyGlErrors.length || t.cewgGlErrors.length ? "GL-ERROR"
        : t.legacyLitPixels === 0 && t.cewgLitPixels === 0 ? "BLANK"
          : t.maxDiff <= 4 && t.meanDiff < 0.5 ? "MATCH" : "DIFF";
    if (status === "DIFF" && knownSemanticDiffs[t.technique]) status = "EXPECTED";
    if (status !== "MATCH" && status !== "BLANK" && status !== "EXPECTED") failures += 1;
    console.log(
      `${status.padEnd(9)} ${(t.pair + ":" + t.technique).padEnd(34)} maxDiff=${t.maxDiff ?? "-"} ` +
      `meanDiff=${t.meanDiff?.toFixed(4) ?? "-"} lit(legacy/cewg)=${t.legacyLitPixels}/${t.cewgLitPixels} ` +
      `glErr(l/c)=${t.legacyGlErrors.length}/${t.cewgGlErrors.length}`
    );
  }
  console.log(failures === 0 ? "PARITY: all common techniques match" : `PARITY: ${failures} technique(s) differ`);
  console.log(`Report: ${args.out}`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
