# ccpwgl notes: one-sided hull reflection smear (2026-08-12)

Open, unexplained. This file exists so the next attempt starts from observation
rather than from a conclusion.

## Symptom

Reflections on one side of a hull are **stretched along the hull** — smeared
rather than mis-coloured — while the other side looks correct.

Clearest repro: `ab1_t1:amarrbase:amarr`.

Observed properties, all from the maintainer:

- **Rotating the ship moves the affected region**; it travels with the hull like
  a reflection.
- **Changing the sun does nothing.** Not a lighting or terminator effect.
- **Affects only some hulls**, and shows first on Amarr — consistent with those
  having the strongest specular response rather than with anything Amarr-specific.
- **All hulls have mirrored UVs**, so mirroring alone cannot be the
  discriminator between affected and unaffected hulls.
- The hard black patches seen earlier are, on the maintainer's later reading,
  **the environment itself — stretched out of proportion**. So the "black
  patches" and the "smear" are most likely ONE fault, not two: a dark region of
  the cube smeared across a large area of hull reads as a black patch with a
  hard edge.

  Do not treat blackness and stretching as separate symptoms needing separate
  causes. An earlier draft of this note asserted they were distinct; that was
  wrong.

  Separately, the blur cube WAS being purged — measured, state -2 PURGED with
  `good: false` — and `EveSpaceScene` now calls `KeepAlive` on the env maps.
  That fix stands on its own: a silently evicted resource is a defect whatever
  else is true. But it should not be assumed to have fixed this, and the
  reflection artifact should be re-checked now that the maps stay resident.

## What a smear implies

A stretched reflection means the reflection vector varies along fewer axes than
it should — the lookup is collapsing in one direction. That is the signature of
a degenerate or mis-signed tangent frame, not of a wrong cube map: a bad cube
gives wrong colours or black, not smearing. Cube UVs do not exist as such; the
lookup is a direction, so "not UV'd correctly" most likely means the normal
being reflected is wrong.

That is a hypothesis, not a finding. It has not been tested.

## Prior work is DISOWNED

Earlier agent conclusions about this artifact — that the vertex and pixel shader
translations were verified faithful, that the cause was therefore a ccpwgl
bindings problem, that mesh data was proven symmetric, and a horizon-occlusion
term as the narrowest target — were **withdrawn by the maintainer on 2026-08-12**
as incorrect work. Do not cite or build on any of it. The agent memory carrying
them has been marked accordingly.

Treat the translator, the bindings, the mesh data and the shader maths as all
still open.

## Established first-hand 2026-08-12 (not inherited)

Measured on `ab1_t1.gr2`, 10,144 vertices, decoded offline with
`@carbonenginejs/runtime-utils/tangent`:

- The mesh carries **only** a packed TANGENT stream — `normal` and `binormal`
  are empty, so the whole frame comes from the packed angles. `isPacked` true.
- **Every decoded frame is unit-length and orthogonal, on both sides.** No
  degenerate binormals, no null tangents, mean `|T·B|` about 0.007 in every
  bucket. The data is not the fault.
- Handedness tracks the side, as a mirrored hull should:

      LEFT  (x<0)   sign=+1   196    sign=-1  4458
      RIGHT (x>=0)  sign=+1  5105    sign=-1   385

  The reported bad side is the RIGHT, which is the `sign=+1` population.
- **CCP's vertex shader decode matches our CPU codec exactly.** Read from the
  translated `quaddetailv5.sm_depth` vertex stage: angles are `TANGENT*2pi - pi`,
  the handedness test is `(0 < a1) && (0 < a3)` — the same asymmetric AND — and
  the sign is applied to **N only**; T and B pass through unflipped. All three
  are then transformed by `cb3[0..2].xyz` into varyings.

- **UVs confirm which half is mirrored.** `texcoord0` on the model's LEFT half
  (x<0) runs to u = -0.999 with **95.9% of vertices outside [0,1]**; the right
  half is 7.0%. The out-of-range count (4461) matches the `sign=-1` bucket
  (4458), so mirroring and handedness are one population. Viewed from the front
  the model's left appears on the viewer's right, which is the reported side.
- **The wrap-mode gate is NOT firing.** `Tw2SamplerState.Apply` forces
  CLAMP_TO_EDGE on any texture without mipmaps — a real trap, documented in
  place — but measured at runtime every hull map reports `mips: true` and
  `pot: true`, and the container declares `U WRAP, V WRAP` for the material
  sampler. Checked because clamped wrap on a half whose UVs are 96% out of
  range would smear exactly like this; it is not the cause here.
- **The pixel stage honours the authored handedness.** It uses the supplied
  binormal varying rather than recomputing `cross(N, T)`:
  `normal = T*n.x + B*n.y + N*n.z`, reading `vs_r3`, `vs_r4`, `vs_r2`. A
  recomputed binormal would have inverted the mirrored half; it does not.
- **The BC5 normal map is read correctly** — only `.xy` is sampled from the
  ATI2 texture and decoded to [-1,1], which is right for two-channel BC5.

So excluded, all on evidence gathered here: the tangent data, the vertex-stage
decode, the pixel-stage TBN application, the mip/wrap gate, and the normal-map
channel read.

What remains: whether the TBN varyings arrive carrying what the vertex stage
computed — `cb3[0..2].xyz` is the per-object transform the frame is rotated by,
and it is supplied by ccpwgl. A wrong transform would normally break both
halves, so if it is the cause it must interact with handedness. That asymmetry
is the next thing to explain, and it is the last unexamined link.

## CAUSE FOUND 2026-08-12 (maintainer)

**The normal map's sampler state has `addressU` = 3 (CLAMP_TO_EDGE) instead of
1 (WRAP)**, on the dx11 -> webgl2 path only. The mirrored half's UVs are 96%
outside [0,1], so a clamped U pins them to the edge texel and the normal map
smears along the hull — which reads as a stretched reflection, because the
perturbed normal is what the reflection vector depends on.

**gles2 renders correctly**, so CCP's own shaders and their sampler
declarations are fine. The fault is in the dx11 translate-at-load path.

Narrowed, on evidence:

- `Tw2SamplerState` defaults every address mode to `GL_REPEAT`, so the 3 is
  real data rather than an unset field falling back.
- **Our emitter records no sampler pairing at all** — every resource binding in
  the translated container has `samplerRegisterIndex` and
  `samplerRegisterIndices` undefined. So `getSamplerRegisterIndex`
  (`Tw2CarbonEffectReader.js`) cannot be getting the pairing from us.
- With no pairing, that function falls through to
  `samplersByRegister.get(resource.registerIndex)`, then to `get(0)`. The DXBC
  declares only two samplers — register 0 `WRAP/WRAP`, register 1
  `CLAMP/CLAMP/CLAMP` — so `NormalMap` at resource register 3 should land on
  register 0 and come out WRAP.

So either `samplersByRegister` is keyed by something other than the DXBC
sampler register, or `resource.carbon` carries a pairing that selects the clamp
sampler. That is the next thing to read, and it is a small read.

**The observed state matches no declared sampler.** It reads
`U CLAMP(3), V CLAMP(3), W REPEAT(1)`, while sampler 0 is `1,1,3` and sampler 1
is `3,3,3`. The same values appear in the wrong slots, and `GL_REPEAT` is also
`Tw2SamplerState`'s default for an unset field — so this is assembled, not
selected.

## Working theory (maintainer, 2026-08-12)

ccpwgl carries a pile of sampler, override and mip defaults that were needed to
make WebGL work originally — WebGL1-era compensations, several of which
conflate unrelated concerns. **They were bugs written to cancel other bugs, and
as the shader path gets more correct they stop cancelling and start showing.**

The mip/wrap gate in `Tw2SamplerState.Apply` is a documented example: it uses
`hasMipMaps` as a proxy for power-of-two because `_isPowerOfTwo` is never passed
in, and its own comment warns that lifting it would hand every screen-space pass
its authored wrap mode at once, changing together anything that currently looks
right BECAUSE of the clamp.

Consequences for how to approach this:

- A sampler's final state may be the product of several compensations rather
  than of any single declaration, which is why it can match nothing declared.
- The fix is not "correct the decode" but "work out which compensation is still
  earning its place". They cannot all be lifted at once.
- Expect more of these to surface as the dx11 path improves. A defect that
  appears when something else is fixed is the signature, and it will look like a
  regression caused by the improvement.

The discriminator gets sharper under this theory: **dump every sampler, not just
the normal map.** All shifted the same way means one decode bug. Only some wrong
means the pile — and which ones are wrong identifies the compensation that fired.

Whichever it is, it is a **binding** fault, not a translation one — the third
today, after the composite's permutation and parameter bindings. The emitted
GLSL merges resource and sampler into one uniform, so a wrong pairing is
invisible in the shader source and only shows up in the reader.

## First tests, cheapest first

1. **Compare an affected hull against an unaffected one** — vertex declaration
   and tangent encoding first. EVE ships both packed (angle-packed vec4) and
   unpacked tangent frames, and the `packed_*` / `unpacked_*` effect naming is
   per-effect. If affected hulls consistently use one encoding, that is the
   answer and the fix is local.
2. **Check whether the smear follows the mirrored half specifically**, by
   finding any geometry whose UVs are not mirrored, or by comparing which half
   of a known-mirrored hull is affected across several ships. If it is always
   the same half in hull space, handedness is implicated.
3. Only then reach for the shader. `$verify-shader-translation` owns the method,
   and its Oracle 1 (DXBC disassembly, `CjsDxbcFormat.disassemble`) is sound
   regardless of what was claimed before.

## Related hazard

`WrappedScene.UseCarbon()` sets `Gr2Reader.DEFAULT_OPTIONS.unpackTangents` — a
GLOBAL applied to geometry loaded afterwards — to satisfy what is a PER-EFFECT
expectation. One ship can carry both `quadv5` and `unpacked_quadv5` across its
areas and one global cannot satisfy both. Worth confirming its state before
concluding anything about tangent data.
