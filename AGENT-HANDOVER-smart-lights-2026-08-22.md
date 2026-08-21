# Smart lights - handover, 2026-08-22 (UPDATED, geometry landed)

Operator direction: **get the light GEOMETRY working first. Actual light
emitters afterwards.** The collector/emitter bridge is explicitly SECOND.

Mapping that onto Carbon's classes: the light GEOMETRY is
`EveSmartLightQuad` and `EveSmartLightMesh`; the EMITTERS are
`EveSmartLightPointLight` and `EveSmartLightSpotLight`.

## Most of this was already ported - check before deriving

`e:\carbonenginejs-org\runtime-trinity\src\eve\smartLights\` is the org's checked
transcription and is where ccpwgl's `src/eve/smartLights/**` came from. It has
`EveChildSmartLightSet.js` (315 lines, complete) and `EveSmartLightQuad.js`.
`src\eve\distribution\**` and `PlacementDataWithIdentifier` were already ported
here too. Almost nothing today needed deriving from Carbon C++.

**Two defects in the org port - do NOT transcribe them.** Its
`core/Tr2QuadRenderer.js` `AddQuads` integer-indexes a named-key record, so
every instance would upload zeros; and its `QUAD_INSTANCE_SIZE = 108` is BYTES
while the code divides it by 4 as floats, conflating the float32 pool with
Carbon's float16 tail. ccpwgl keeps everything float32 and sidesteps both.

## DONE today

**Blocker 1 is gone.** `EveChildSmartLightSet` was `@meta.notImplemented` in
`src/unsupported/eve/child/` and discarded both fields that matter through
`skippedObject`/`skippedObjectArray`, so a hull carrying smart lights parsed
without error and hydrated NOTHING. Replaced with a real implementation at
`src/eve/smartLights/EveChildSmartLightSet.js`; the stub and its barrel entry
are deleted.

**`EveSmartLightQuad` renders.** Its five unresolved imports are resolved and it
owns its own geometry.

**The stale note at the top of `src/index.js` is corrected** - it claimed the
whole tree was unregistered, which stopped being true some time ago.

### The one design decision

Carbon has no per-set geometry: every quad-ish child pushes a 108-byte instance
record into the process-wide `Tr2QuadRenderer` singleton, which merges the pool
once a frame and issues ONE instanced draw per registered effect
(`Tr2QuadRenderer.cpp:210-313`).

ccpwgl has no instancing path here, and `EveChildQuad`
(`src/unsupported/eve/child/EveChildQuad.js`) has already solved the same
problem by DE-INSTANCING: it replicates the instance record into all four corner
vertices and draws with `drawElements`. `EveSmartLightQuad` now generalises that
from one quad to N. The vertex layout is `EveChildQuad.vertexDeclarations`
unchanged, which is the same layout Carbon declares at `EveChildQuad.cpp:33-51`
and that the smart-light quad reuses verbatim (`EveSmartLightQuad.cpp:61,70`).
Every float lands where the shader expects it; only the draw call differs.

Porting the singleton was rejected: it buys nothing without instancing and the
org's version carries the two defects above.

### Two adaptations at the parent boundary, both deliberate

1. **The set extends `EveChild`, not Carbon's `EveChildTransform`.** ccpwgl's
   effect children all extend `EveChild`, and the parent loops call
   `UpdateLod`/`ResetLod` on every entry with NO guard (`EveShip2.js:724`), which
   `EveChildTransform` does not have. Nothing is lost:
   `EveChildSmartLightSet_Blue.cpp` maps exactly four attributes - name, display,
   distribution, lightGroups - so the set persists no SRT of its own and its
   world transform is just the parent's.
2. **The set is the adapter.** It speaks ccpwgl upward
   (`Update(dt, parentTransform, perObjectData)` + `GetBatches`) and Carbon
   downward (`UpdateSyncronous`/`UpdateAsyncronous(ctx, params, distribution)`),
   so the ported distribution methods and groups keep their Carbon names.

`updateContext` is a one-method duck. A repo-wide grep of `src/eve/distribution/**`
and `src/eve/smartLights/**` finds `updateContext.GetDeltaT` and nothing else, so
porting `EveUpdateContext` would be dead weight.

**Frustum:** Carbon culls per placement inside `AddQuadsToQuadRenderer`, which
runs at render time with a frustum in hand. ccpwgl builds geometry during update
and has no frustum there, so the set captures it in `UpdateLod` and pushes it
onto each group's `_frustum`.

### Faithful asymmetries preserved (they read as bugs and are not)

- Quad alpha comes from the RAW `customColor`, not from the faction-resolved
  group colour (`EveSmartLightQuad.cpp:162`).
- `localTransform` is SYNTHESISED per placement (diagonal scale + placement
  translation), unlike `EveChildQuad` which copies its authored one.
- Quaternion order: Carbon `initialRotation * additionalRotation` is
  `quat.multiply(out, additionalRotation, initialRotation)` in gl-matrix. Verified
  term by term in the org port.
- Index winding `[0,2,1,0,3,2]` is non-negotiable
  (`Tr2QuadRenderer.cpp:222`); ccpwgl already recorded that the reversed order
  culls these quads away entirely (`EveChildQuad.js:260-261`).
- `size` from `GetNumberOfPlacements()` can be SMALLER than `placements.length`.
  It is the one that counts.

### Shader

`EveSmartLightQuad.cpp:27,31,44,48` - `FlareQuad.fx`, or `flarequadsoft.fx` when
`softQuad`. Both are already tier-pinned to `sm_hi` in `src/config.js`
(`FX_TIER_PINS`) because their `sm_depth` bodies set `RS_ZENABLE 0` and sample an
unpublished `DepthMap`, so they would draw over the hull. `flarequad` also has a
full hand-crafted `replaces` override in `src/toDeprecate/shaders/other/flarequad.js`
declaring `CULL_NONE`. **`flarequadsoft` has no override module** - untested, but
`softQuad` defaults to false so it is off the critical path.

## NOT DONE - and the honest state

**NOTHING HERE HAS BEEN SEEN TO RENDER.** It builds, it lints, the bundle is
rebuilt. No asset carrying a smart light set has been loaded. Per the standing
rule (green unit tests prove the logic, not the frame) this is unverified until
the operator loads it.

**No test asset is known.** `runtime-sof/src/sof/EveSOF.js:116` lists
`EveChildSmartLightSet` in the SOF's allowed-child-class set, so SOF hulls CAN
carry them, but no doc, note or corpus index names a specific hull or `res:/`
path. The reader used to fail silently; now that it hydrates, logging on
hydrate will find one. Smart light sets are newer art - Triglavian, Upwell
structures, recent Empire hulls are where to look first.

**`EveSmartLightMesh` has never been ported**, here or in the org. Carbon's
extends `EveChildInstanceMeshRenderer`, so that base is needed first. It is the
other half of "light geometry". Its own fields, beyond the shared base-group
set, are `mesh`, `castShadows`, `rotationConstraint`, `staticOffsetTranslation`,
`staticOffsetRotation`, `staticOffsetScale`, `shaderParamColorName`,
`minScreenSize`. Its whole job is to drive an instanced mesh from the placement
list and push the group colour into a named shader parameter.

## Blocker 2 - the emitter bridge (SECOND, per the operator)

`EveSmartLightPointLight.GetLights` transcribes runtime-trinity's contract
verbatim: `GetLights(lightManager)`, one `lightManager.AddLight(record)` per
placement, record shaped like Carbon `PerLightData`.

ccpwgl's sink is different in three ways: `Tw2CarbonLightCollector.Collect(rows)`
takes an ARRAY; the row is `{position, radius, color, flags, params[4]}`; and the
caller convention is `GetLights(collector, parentContext)`.

**Re-check that note before designing anything - it may be partly stale.** The
attachment light work went through `lightConversion.js`, and `AsPerSpotLightData`
DOES carry `outerAngle` and `projectionPlaneDistance`. The claim that the
collector row has no cone fields may no longer hold, which changes how much of a
bridge is actually needed. Spot lights are the hard case either way.

`EveChildSmartLightSet.GetLights` already fans out to the groups, so when a
group grows a ccpwgl-shaped `GetLights` it is wired.

## Also open, unrelated

**Shadow acne - CAUSE FOUND AND FIXED 2026-08-22.** The bias was not missing and
the sign was not wrong; `gl.polygonOffset(2,2)` was being overwritten with
`(0,0)` by `SetStandardStates` -> `ApplyShadowState` before every caster draw.
See `AGENT-FINDINGS-shadow-acne-2026-08-22.md`. **The sign-flip lead in the
previous version of this note was wrong - do not flip the bias negative.**

**dist provenance.** `dist/` is committed and built from the WORKING TREE, and
skindr vendors it by copy to `e:\skindr\web\vendor\ccpwgl2_int.js`. A transient
state in anyone's tree gets captured and shipped onward with no provenance
stamp. This already bit us once and read as "lights, sprites and beams are all
broken" while cppc was fine. **Compare the artefacts before theorising about the
code.**

**Uncommitted, not mine**: `src/runtime/character/TnyCharacterAppearanceManager.js`,
`gles/TnyGlesAtlasComposer.js`, `gles/TnyGlesCharacterAdapter.js`. They are baked
into the pushed bundle with no matching committed source.
