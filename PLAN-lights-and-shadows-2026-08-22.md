# Plan: smart lights, attachment light data, shadows

Written 2026-08-22. Four workstreams in the order the operator listed them.
Dependencies run 1 -> 2, and 3 blocks 2 (they share one sink), so 3 is worth
doing before 2 despite the numbering.

---

## 1. Smart lights, geometry only (no emitters)

**Status: the quad half is DONE and committed (`4cba407c`), unverified in a
frame.** What remains:

### 1a. Verify the quad actually renders - BLOCKING everything below

Nothing here has been seen in a frame, and **no asset carrying a smart light set
is known**. This is the immediate next step and it is a search, not a code
change.

The reader used to fail silently; now that `EveChildSmartLightSet` hydrates, a
log on hydrate will find one. `runtime-sof/src/sof/EveSOF.js:116` lists it in
the SOF's allowed-child-class set, so SOF hulls can carry them. Smart light sets
are newer art - Triglavian, Upwell structures and recent Empire hulls first.

Until a test asset exists, everything below is written against source rather than
behaviour. Record the asset in the handover once found.

### 1b. `EveSmartLightMesh` - the other half of "geometry"

Never ported, here or in the org - the only smart-light class in that position.
Carbon's extends `EveChildInstanceMeshRenderer`, so that base is needed first
(ccpwgl has `src/unsupported/eve/child/EveChildInstanceMeshRenderer.js` - assess
before assuming it needs writing).

Its job: drive an instanced mesh from the placement list and push the group
colour into a named shader parameter. Fields beyond the shared base-group set:
`mesh`, `castShadows`, `rotationConstraint`, `staticOffsetTranslation`,
`staticOffsetRotation`, `staticOffsetScale`, `shaderParamColorName`,
`minScreenSize`.

Note `SetMeshColorParameter` is heavily early-returning in Carbon and caches
`m_lastAreaColor` - a no-op when `shaderParamColorName` is empty, which is the
common case. Do not "fix" that.

### 1c. `flarequadsoft` has no override module

`softQuad` selects it and it is tier-pinned but never overridden, unlike
`flarequad`. Defaults false, so it is off the critical path - but the first hull
that authors `softQuad: true` will find out the hard way. Check whether the
pinned tier compiles before that happens.

---

## 3. Light data on attachments (do this BEFORE 2 - shared sink)

Listed third by the operator; sequenced second here because it and workstream 2
feed the *same* collector, and whatever is wrong with 3 will be wrong with 2.

**The most likely reason it "doesn't seem to be working" is that it is barely
built, and what is built may be invisible on the profile being tested.** Two
findings, both checked in source today:

**(a) Only ONE attachment type owns lights.** `AddLightFromSOF` and a `lights`
list exist on `EvePlaneSet` and nowhere else. Spotlight sets, sprite sets,
banners and decals have none, and `EveSOFData` has one hook,
`SetupPlaneSetLights`, gated to sof6. So "attachment lights" currently means
"plane set lights on sof6 hulls" - on any hull whose lit attachments are
spotlights or sprites, there is nothing to see and no bug to find.

**(b) The sink may not be read on the profile under test.** The chain is
`EveSpaceScene.UpdateCarbonLights` -> `PerChildObject("GetLights")` ->
`Tw2CarbonLightCollector` -> `Tw2CarbonResourceBinder.SetLightList`. The
scene's own comment says this is *"inert until a Carbon effect samples them"* -
i.e. the translated dx11 path. Standing operator guidance is to test in gles2
because it has more shader coverage for Jita. **If attachment lights are being
judged in gles2, they cannot appear regardless of correctness.**

### Order of work

1. **Determine which profile is being judged, and confirm the light list is
   sampled there.** One question, and it decides whether there is a bug at all.
   This is cheap and must come first - it is exactly the "confirm the code path
   executes before proposing a cause" rule that cost seven wrong theories on
   dx11 sprites.
2. **Instrument the collector, don't theorise.** After `Resolve`, log the row
   count and the first row. Three distinct failures look identical from the
   outside: no lights were *added*, lights were added and *culled*, or lights
   survived and *nothing samples them*. The count separates them in one frame.
3. **Then, and only then**, extend `AddLightFromSOF`/`GetLights` to spotlight
   sets and sprite sets, following `EvePlaneSet` exactly.
4. Wire `EveComponentType.LightOwner` registration properly. Carbon collects
   from a component registry, not by walking the tree
   (`EvePlaneSet.cpp:535-541`); ccpwgl declares the component type but every
   registration is optional-chained away, and `EveObject.GetLights` walks
   instead. The walk is a documented stand-in, not a bug - but it is the reason
   an attachment can fill its lights from SOF and still never be collected.

Do NOT start by adjusting radii or falloff. "All lights look the same with hard
reflections" was the original complaint and the derivation work is already done
(`outerScaleMultiplier`/`innerScaleMultiplier` -> `radius`/`innerRadius`); if
zero lights are reaching the shader, tuning them changes nothing.

---

## 2. Smart lights WITH emitters / light data

Blocked on 3, because it terminates in the same collector.

`EveSmartLightPointLight.GetLights` still speaks Carbon's contract verbatim:
`GetLights(lightManager)`, one `lightManager.AddLight(record)` per placement,
record shaped like Carbon `PerLightData`. ccpwgl's sink differs in three ways -
`Collect(rows)` takes an ARRAY, the row is
`{position, radius, color, flags, params[4]}`, and the call is
`GetLights(collector, parentContext)`.

**Re-check the "no cone fields" claim before designing a bridge.** It predates
the attachment light work, which went through `lightConversion.js`, and
`AsPerSpotLightData` now carries `outerAngle` and `projectionPlaneDistance`. If
the row already carries cones, the bridge is much smaller than the note implies.
Spot lights are the hard case either way.

`EveChildSmartLightSet.GetLights` already fans out to the groups, so a group
gains a ccpwgl-shaped `GetLights` and it is wired - no plumbing needed above it.

Also open and explicitly separate: nothing calls
`RegisterSecondaryLightSource`, so placements exist but no object offers itself
as a bounce source.

---

## 4. Shadows

**Acne: cause found and fixed today (`f97ce4f0`), unverified in a frame.**
`gl.polygonOffset(2,2)` was being overwritten with `(0,0)` by
`SetStandardStates` -> `ApplyShadowState` before every caster draw. Full write-up
in `AGENT-FINDINGS-shadow-acne-2026-08-22.md`.

### 4a. Verify, and read the result carefully

Three outcomes, each pointing somewhere different:

- **Triangles gone, cast shadow unchanged** - it was the bias. Done.
- **Shadow DETACHES from its caster** (peter-panning at the hull junction) - the
  mechanism is confirmed and 2/2 is too strong. Lower `casterSlopeBias` toward
  Carbon's 1.0. On a float depth target the constant term is nearly useless near
  zero, so slope is the knob; leave `casterDepthBias` alone.
- **Triangles unchanged** - the bias was not it, and 4c moves to the top.

Live, no rebuild: `scene._carbonShadowRenderer.casterSlopeBias = 1`.

### 4b. The flicker may be a separate problem from the acne

They were reported together and are not necessarily one fault. Judge them
separately after 4a: acne is a per-triangle pattern, flicker is temporal.

### 4c. Receiver reconstruction precision (the standing suspect for flicker)

The receiver position is reconstructed by unprojecting the scene depth buffer,
and the SCENE path is still forward-Z -
`/docs/contracts/depth-convention.md:9-13, 68-71` records the reverse-Z
conversion as not yet done at the engine seam. Forward 32F at EVE's near/far
ratio carries error that the resolve's plain compare has no tolerance for.
**Speculation until the demo camera's actual near/far is measured** - measure it
before acting.

### 4d. `EXT_depth_clamp` is probably not a real WebGL2 extension

If it resolves to nothing, Carbon's `RS_DEPTH_CLIP_ENABLE = FALSE` has no
runtime equivalent at all, because the documented fallback `casterNearExtend`
defaults to 0. Symptom would be parts of the shadow popping in and out, not
acne. One line to check: `gl.getSupportedExtensions()`.

### 4e. `RENDER_STATE_PATHS = ["/decals/"]` discards authored Shadow states

All 135 hull shaders declare `Shadow` +1/+1 and we throw those states away on
read. Real, low priority now that `casterSlopeBias` supersedes them, and
widening the allowlist blindly is known to break the flare quads - which
workstream 1 now depends on. **Do not widen it while smart light quads are being
brought up.**

### 4f. The resolve pass

Longer-standing: prior work recorded that `EveSpaceSceneShadowMap` is a
SCREEN-SPACE visibility buffer, the cascade depth is a different slot, and the
missing piece is the resolve. Separate from everything above; do not conflate.

---

## Cross-cutting rules for all four

- **Nothing counts until it renders in a frame.** Green unit tests prove the
  logic, not the picture. Twice pushed unverified on 2026-08-21.
- **Confirm the code path executes before proposing a cause.** Seven wrong
  theories on dx11 sprites came from skipping this.
- **Compare artefacts before theorising about code.** `dist/` is committed, built
  from the working tree, and vendored into skindr by copy. A stale bundle has
  already read as "lights, sprites and beams are all broken".
- **Read the owning doc first.** `/docs/contracts/carbon-shadow-resolve.md` and
  `depth-convention.md` already held the depth convention that today's shadow
  work needed; the org's `runtime-trinity` already held most of the smart light
  port.
