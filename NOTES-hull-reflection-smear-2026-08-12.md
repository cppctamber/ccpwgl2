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

So the tangent data and the vertex-stage decode are both **excluded**, on
evidence gathered here rather than on the withdrawn claims.

What remains: the pixel stage's use of the TBN varyings, and what `cb3` actually
supplies — the per-object transform rows the frame is rotated by.

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
