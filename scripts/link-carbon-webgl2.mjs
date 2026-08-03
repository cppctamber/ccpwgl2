import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { CjsWebglFormat } from "@carbonenginejs/runtime-resource/formats/webgl";

const src = process.argv[2];
const built = CjsWebglFormat.buildEffect(new Uint8Array(readFileSync(src)), { source: src });
const read = CjsWebglFormat.read(built.bytes);

const shaders = new Map(read.shaders.map(s => [ s.key, s ]));
const groups = new Map();
for (const st of read.stages) {
  if (st.stageName !== "vertex" && st.stageName !== "pixel") continue;
  const k = `${st.bodyKey}.${st.techniqueName}.pass${st.passIndex}`;
  const g = groups.get(k) || {};
  g[st.stageName] = shaders.get(st.shaderKey)?.source || null;
  groups.set(k, g);
}
const programs = [...groups.entries()]
  .filter(([, g]) => g.vertex && g.pixel)
  .map(([key, g]) => ({ key, vertex: g.vertex, pixel: g.pixel }));

console.log(`${src.split(/[\/]/).pop()}: ${programs.length} vertex+pixel programs to link`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const result = await page.evaluate((programs) => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return { error: "no webgl2 context" };
  const out = { linked: 0, failed: [] };
  for (const p of programs) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, p.vertex); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, p.pixel); gl.compileShader(fs);
    const okv = gl.getShaderParameter(vs, gl.COMPILE_STATUS);
    const okf = gl.getShaderParameter(fs, gl.COMPILE_STATUS);
    if (!okv || !okf) {
      out.failed.push({ key: p.key, stage: !okv ? "vertex" : "pixel",
        log: (!okv ? gl.getShaderInfoLog(vs) : gl.getShaderInfoLog(fs) || "").slice(0, 200) });
      continue;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) out.linked++;
    else out.failed.push({ key: p.key, stage: "link", log: (gl.getProgramInfoLog(prog) || "").slice(0, 200) });
    gl.deleteProgram(prog);
    gl.deleteShader(vs); gl.deleteShader(fs);
  }
  return out;
}, programs);
await browser.close();

if (result.error) { console.log("ERROR:", result.error); process.exit(1); }
console.log(`linked: ${result.linked}/${programs.length} | failed: ${result.failed.length}`);
for (const f of result.failed.slice(0, 5)) console.log(`  FAIL ${f.key} [${f.stage}] ${f.log.replace(/\n/g," ")}`);
