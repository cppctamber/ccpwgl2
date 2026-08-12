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
- Present with the environment maps loaded and good, so it is distinct from the
  purge bug fixed on 2026-08-12 (`EveSpaceScene` now calls `KeepAlive` on the
  env maps; a purged blur cube produced hard BLACK patches, not a smear — do not
  conflate the two).

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
