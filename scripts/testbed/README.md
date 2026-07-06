# ccpwgl testbed

Headless, agent-runnable diagnostics for the CEWG (translated DX11) shader
path. Runs without a browser or the resource server, loading `.cewg` packages
through ccpwgl's real `Tw2EffectRes` pipeline against a stubbed GL context and
dumping everything you'd otherwise extract by hand in the devtools console.

## cewg-diagnostics.js

```sh
node scripts/testbed/cewg-diagnostics.js <package> [options]
# or
npm run testbed:cewg -- <package> [options]
```

`<package>` is a bare filename (resolved against `test/fixtures/`, then the
local synthetic server cache `ccpwgl2-server/public/cache/synthetic/`) or a
path to a `.cewg` file.

### What it dumps

- **package** — version, permutation dimensions + default option per dimension,
  technique list, source path.
- **per technique/pass** — `isCewg`, and per stage:
  - vertex inputs: `usage` code + name, `usageIndex`, emitted `attr` name,
    register (this is where the skinned BLENDINDICES 6↔7 binding is visible).
  - textures: register → name → sampler (the `s0..sN` binding table).
  - constants: register → name → size.
  - `cewgBindings`: constant buffers, structured UBOs (bone `CewgSb0`),
    structured textures (light-list `sb11`/`sb12`), post-fx buffer textures.
  - optionally the emitted GLSL (`--glsl` or `--glsl-lines N`).
- **constant packing** — runs `CewgCarbonData` b1–b4 packing on provenance-
  stamped GLES input, so each Carbon register shows which GLES register/column
  it came from (`gN.C`) or whether it's zeroed/synthesised.
- **mesh** (`--mesh file.gr2`) — vertex declaration channels with sample
  vertices decoded **both** as float values and int bit patterns, so
  blend-index vs weight vs tangent channels are unambiguous.
- **apply** (`--apply`, best-effort) — records a real `ApplyPass` through a
  recording GL stub and summarises the GL activity (attribute/uniform-block
  bindings, `uniform4fv` uploads, texture-unit binds). Needs a fully-linked
  program the stub can't always fake; the binding manifest is available
  statically regardless.

### Options

| flag | meaning |
|---|---|
| `--options k=v,k=v` | permutation overrides, e.g. `SPACE_OBJECT_PPT_ENABLED=SOPPT_ENABLED` |
| `--technique NAME` | restrict the per-pass dump to one technique |
| `--glsl` / `--glsl-lines N` | include full / first-N-lines of emitted GLSL per stage |
| `--mesh PATH` | also decode a `.gr2` mesh |
| `--mesh-verts N` | sample vertex count (default 6) |
| `--apply` | run the recorded ApplyPass |
| `--json` | emit one JSON document instead of readable text (for agents) |

### Examples

```sh
# skinned hull, default permutation, human-readable
npm run testbed:cewg -- unpackedskinned_quadv5.webgl.cewg --technique Main

# depth tier with patterns on, JSON for an agent to parse
npm run testbed:cewg -- unpackedskinned_quadv5_depth.webgl.cewg \
  --options SPACE_OBJECT_PPT_ENABLED=SOPPT_ENABLED --json

# decode a mesh's blend/tangent channels both ways
npm run testbed:cewg -- unpackedskinned_quadv5.webgl.cewg \
  --mesh path/to/hull.gr2 --mesh-verts 8
```
