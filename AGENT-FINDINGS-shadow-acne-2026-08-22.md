# Shadow acne - cause found and fixed, 2026-08-22

Symptom: hull covered in alternating black/transparent TRIANGLES, plus flicker,
while the ship's cast shadow shape was correct. Triangle-shaped acne implicates
SLOPE-scaled bias.

## This was already researched - read these before re-deriving

The convention half of this was written down long before today. Both owning
pages were found by a read-only agent, not derived:

- `e:\carbonenginejs-org\docs\contracts\carbon-shadow-resolve.md:171-174` - the
  caster pass clears depth to 1.0 and runs standard FORWARD depth (`LESSEQUAL`,
  `RM_OPAQUE`, depth clip disabled), and explicitly notes the surrounding scene
  runs reverse-Z and this pass turns that off.
- `e:\carbonenginejs-org\docs\contracts\depth-convention.md:71` - lists the
  shadow caster pass as opting out of reverse-Z, "Carbon does exactly this".
- `e:\shaderDiscovery\artifacts\dx11-render-state-summary.json` /`.md:30-31` -
  the corpus tally of RS_SLOPESCALEDEPTHBIAS (175) and RS_DEPTHBIAS (195).

## The cause: the bias was configured, enabled, and zeroed before every draw

`gl.enable(POLYGON_OFFSET_FILL)` was present and `gl.polygonOffset(2, 2)` was
called per cascade. Both were then overwritten by ccpwgl's own state machine
before a single caster triangle was drawn:

1. `Tw2CarbonShadowRenderer.js` - `gl.polygonOffset(casterSlopeBias, casterDepthBias)`
   inside the cascade loop, then `this._context.Render(CASTER_TECHNIQUE)`.
2. `Tw2RenderBatchAccumulator.js:160-165` - each batch triggers
   `device.SetStandardStates(batch.renderMode)`; casters are collected as
   `RM_OPAQUE`.
3. `Tw2Device.js:272-273` - the RM_OPAQUE table carries
   `RS_SLOPESCALEDEPTHBIAS: 0, RS_DEPTHBIAS: 0`.
4. `SetStandardStates` -> `SetRenderState` writes those zeroes into
   `device._depthOffsetState.states` and marks it dirty.
5. `Tw2GeometryRes.js:494` calls `device.ApplyShadowState()` before EVERY draw,
   which flushes `gl.polygonOffset(0, 0)`.

Net: enabled, configured, and a complete no-op. Textbook un-biased slope acne.

The previous author's comment in `_RenderCasters` PREDICTED this exact clobber
and then applied the re-set *before* `Render()` - i.e. before the state machine
runs - so the fix could never work. With `fitToSubject = true` (the default)
there is exactly one cascade, so the "later cascades might survive" escape hatch
never applies either.

A second, independent route to the same clobber: the scene depth prepass calls
`device.InvalidateStandardStates()` immediately before the shadow pass, which
also marks the offset dirty.

### Second, smaller bug found on the way

`Tw2Device.js` RS_SLOPESCALEDEPTHBIAS/RS_DEPTHBIAS branch read
`this._depthOffsetState[state]` where the values live at
`this._depthOffsetState.states[state]`. That compared against `undefined` every
time, so the branch marked the offset dirty on EVERY call and re-issued
`gl.polygonOffset` on every pass change. Harmless alone; it guaranteed the
clobber. Fixed.

## The fix

Put the value where the state machine keeps re-applying it instead of fighting
it: override `device._renderStates[RM_OPAQUE].states` for the duration of the
caster pass, restore in the `finally`. The direct `gl.polygonOffset` call is
kept as well - it is correct for anything that does not route through
`SetStandardStates`.

**Trap:** `SetRenderState` runs these two states through `num.dwordToFloat`, so
a table value must be a DWORD BIT PATTERN. Writing a plain `2` decodes to a
denormal near 2.8e-45 - silently no bias at all. Added `num.floatToDword` for
this.

## The sign is POSITIVE and that is settled - do not flip it

The handover note's primary lead was that the sign was wrong (`+2/+2` vs
Carbon's `DynamicLightShadow` `-6.0/-1.0`). It is a dead end, and here is why
in one line: **Carbon's two shadow techniques carry OPPOSITE signs in the same
corpus**, because they run opposite depth conventions.

| technique | RS_SLOPESCALEDEPTHBIAS | RS_DEPTHBIAS | files |
| --- | --- | --- | --- |
| `Shadow` | **+1.0** | **+1.0** | 135 |
| `DynamicLightShadow` | **-6.0** | **-1.0** | 135 |

`Shadow` is our pass, and it is positive because Carbon's sun caster explicitly
disables reverse-Z (`EveSpaceScene.cpp:775-776` `SetInvertedDepthTest(false)`,
depth cleared to 1.0 at `Tr2ShadowMap.cpp:246`). ccpwgl matches: `depthFunc(LEQUAL)`,
`clearDepth(1)`, and the D3D->Carbon->emitter composition is a net forward map.

Carbon's bias is not in the C++ at all. Engine-level standard states are zero
(`Tr2EffectStateManager.cpp:46-49`); the bias is authored per pass in the
shipped containers and applied via `D3D11_RASTERIZER_DESC`
(`Tr2RenderContextDx11.cpp:1831-1844`).

## Ruled out, with evidence

- **Low-precision shadow map.** 32F both sides -
  `Tw2CarbonShadowRenderer.js:247` requests precision 32,
  `Tw2DepthRenderTarget.js:281-284` maps it to `DEPTH_COMPONENT32F`, matching
  Carbon's `D32_FLOAT` (`Tr2ShadowMap.cpp:230`). Scene depth is 32F too.
- **Missing `POLYGON_OFFSET_FILL` enable.** Present, and nothing disables it.
  The values were the no-op, not the enable.
- **Sign inversion.** Above.

## Still open

- **`Tw2CarbonEffectReader.RENDER_STATE_PATHS = ["/decals/"]`** discards the
  authored `Shadow` +1/+1 states on all 135 hull shaders. Real, but not the
  acne cause, and widening the allowlist blindly is known to break the flare
  quads. `casterSlopeBias` supersedes it now.
- **`EXT_depth_clamp` is probably not a real WebGL2 extension name** - if it
  resolves to nothing then Carbon's `RS_DEPTH_CLIP_ENABLE = FALSE` has no
  equivalent at runtime, since the documented fallback `casterNearExtend`
  defaults to 0. UNVERIFIED - check `gl.getSupportedExtensions()` live. Would
  show as parts of the shadow popping in and out, not as triangle acne.
- **The flicker may be a separate problem.** The receiver position is
  reconstructed by unprojecting the scene depth buffer, and the SCENE path is
  still forward-Z (`depth-convention.md:9-13, 68-71` records the reverse-Z
  conversion as not yet done at the engine seam). Forward 32F at EVE's near/far
  ratio carries error the plain compare has no tolerance for. SPECULATION - the
  actual near/far was not measured.

## Verify

If the triangles vanish while the cast shadow stays put, this was it. If the
shadow instead DETACHES from its caster, the mechanism is confirmed and 2/2 is
too high - lower `casterSlopeBias` toward Carbon's 1.0. If the triangles are
unchanged, the reconstruction-precision lead moves to the top.

Live A/B, no rebuild:

```js
const r = scene._carbonShadowRenderer;
r.casterSlopeBias = 1;   // Carbon's Shadow value
```
