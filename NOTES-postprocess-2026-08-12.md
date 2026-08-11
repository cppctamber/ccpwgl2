# ccpwgl notes: the post process composite (2026-08-12)

Carbon's composite pass now runs. The colour half works and is verified in the
demo; the lighting passes are not started.

## The rule that bit us, and will again

**A post process class must define its properties even when we cannot support
the effect.** The black reader fails on the first unknown property, so a class
missing one field makes the whole asset unloadable — it does not degrade, it
throws.

The stubs previously here carried a fraction of their properties: vignette had
one of twelve, fade had none. 147 of the 177 shipped environment templates
populate `godRays` and 141 `fog`, so almost every template was unloadable until
those classes were completed.

**Match the CarbonEngineJS classes** in
`carbonenginejs-org/runtime-trinity/src/postProcess/`. They are maintained and
Carbon-verified, and they are the standard to copy — not the Carbon headers, and
not these stubs.

If you ever do go back to Carbon directly, the Blue exposure (`*_Blue.cpp`) is
what the wire follows, not the C++ header: `Tr2PPTonemappingEffect` nests
`m_aces` and `m_uncharted2` in the header while Blue exposes them flat in one
namespace, so a class shaped like the header cannot read shipped data. The
maintained classes already reflect this.

## Still to define

- **`Tr2PostProcessAttributes` does not exist here at all.** Carbon exposes it
  through a macro emitting a PAIR per attribute — `<name>` and `<name>Enabled` —
  across 56 attributes, so it is 112 properties plus `priority` and `intensity`.
  Adding one property at a time just moves the failure to the next unknown.
  Port it from `runtime-trinity/src/postProcess/Tr2PostProcessAttributes.js`,
  which already has it.
  This blocks the six `res:/dx9/postprocess/environmentvolumes/` assets, which
  are `EveEffectRoot2` -> `EveChildPostProcessVolume` ->
  `Tr2PostProcessAttributes` and are how Carbon blends grading as the camera
  moves. `runtime-resource`'s black reader is missing it too — it fails on
  `whiteTemperatureEnabled`.
- **`Tr2PPFidelityFXEffect`** is still a stub in `src/unsupported`. Carbon does
  not expose it on `Tr2PostProcess2` and no shipped asset populates it, so it is
  the one case where an incomplete stub is currently harmless.
**Port from the CarbonEngineJS classes, not from Carbon or from these stubs.**
`carbonenginejs-org/runtime-trinity/src/postProcess/` already holds this whole
family, promoted out of `generated` into maintained source and Carbon-verified —
including `Tr2PostProcessAttributes`, which ccpwgl lacks. That is the source of
record; re-transcribing from `*_Blue.cpp` risks introducing drift that the
maintained classes have already removed. Depth of field, god rays and fog were
spot checked against Blue after porting and match exactly.

## What is implemented

`Tw2PostProcess2` holds the slots and owns no GL, so it stays hydratable from a
black file. `Tw2PostProcessRenderer` owns the effect and the draw. That split is
Carbon's and it matters: putting targets on the data class would make it
unhydratable, which is the whole reason it exists.

Working: tone curve, exposure, white balance, saturation, contrast, gamma,
gain/offset, fade, desaturate, LUTs. The scene renders into an RGBA16F target
(`EveSpaceScene.hdr`) and the composite runs over it
(`EveSpaceScene.compositeEnabled`), both off by default.

Not implemented: bloom, god rays, fog, depth of field, film grain, signal loss.
By shipped usage these matter more than what is done. Dynamic exposure is a
permanent non-goal in this form — Carbon measures its luminance histogram in
compute shaders and WebGL2 has no compute stage.

## Three traps, one shape

All three cost real time, and all three are state that reports as set while the
GPU sees something else. None raised an error and two produced a plausible image.

1. `effect.options = {...}` sets the values and leaves the effect on its
   previous permutation. Only `SetOption` rebinds.
2. A parameter created after the effect first bound is never wired to a
   constant: `OnValueChanged` only rebinds when the effect RESOURCE changed.
3. The HDR gate returns null on an unsupported context while `hdr` still reads
   true.

`Tw2Effect.AutoPopulate` documents the order that avoids the first two:
**SetOption, then set values, then AutoPopulate once.** Use `AutoPopulate(false)`
rather than `PopulateParameters()` when a texture parameter is attached to a
render target — the cleaning variant prunes it.

Constant offsets are **permutation-specific**. The compiler compacts out what a
permutation does not use, so `OutputGamma` sits at byte 176 in the all-enabled
body and byte 72 in a minimal one. Address parameters by name, never by offset.

## Related

- Org docs: `/docs/contracts/carbon-scene-composite.md` owns the pass itself,
  what shipped data populates, and why ACES is absent from EVE.
- `$verify-shader-translation` before blaming the translator for anything here.
