# Smart lights - handover, 2026-08-22

Operator direction: **get the light GEOMETRY working first. Actual light emitters
afterwards.** So the collector/emitter bridge below is explicitly SECOND.

## What is already done

Commit `c70f24ec` ported the classes and the distribution methods that place them:

    src/eve/smartLights/
      EveSmartLightBaseGroup, EveSmartLightColorShareGroup,
      EveSmartLightPointLight, EveSmartLightSpotLight, EveSmartLightQuad
      attributeModifiers/  bucket, cameraDependency, color,
                           controllerVariableListener, expressionBucket,
                           noise, base, enums

That is real code, not stubs. Nothing is `@meta.notImplemented` in that tree.

## Blocker 1 - the data is read and THROWN AWAY (this is the geometry blocker)

`src/unsupported/eve/child/EveChildSmartLightSet.js` is `@meta.notImplemented` and
discards both fields that matter:

```js
static blackReaders = {
    distribution: skippedObject,
    lightGroups: skippedObjectArray
};
```

So a hull carrying smart lights parses without error and hydrates NOTHING - none
of the ported classes is ever constructed. Replacing these two readers is the
first job, and it is what unblocks geometry.

## What geometry needs after that

`EveSmartLightQuad` is the renderable. Its TODOs name what is missing in ccpwgl:

- `EveChildTransform` does not exist here;
- ccpwgl's `EveChildQuad` lives in `src/unsupported/eve/child/`;
- no `Tr2Effect` class - nearest analog is `Tw2Effect`;
- no `TriBatchType` enum / quad-renderer module, so `_effectKey` (the
  quad-renderer bucket key) has no bucket to key into.

**One of its TODOs is now STALE**: it says `vec4.createLinear()` does not exist.
It does as of today (added to `src/global/math/vec4.js` because every attachment
light needed it - constructing `CjsLightData` threw without it). Do not re-derive
that; just delete the TODO.

## Blocker 2 - the emitter bridge (SECOND, per the operator)

`EveSmartLightPointLight.GetLights` transcribes runtime-trinity's contract
verbatim: `GetLights(lightManager)`, one `lightManager.AddLight(record)` per
placement, record shaped like Carbon `PerLightData`.

ccpwgl's sink is different in three ways: `Tw2CarbonLightCollector.Collect(rows)`
takes an ARRAY; the row is `{position, radius, color, flags, params[4]}`; and the
caller convention is `GetLights(collector, parentContext)`. The porter recorded
the mismatch and deliberately invented no mapping.

**Re-check that note before designing anything - it may be partly stale.** Today's
attachment light work went through `lightConversion.js`, and `AsPerSpotLightData`
DOES carry `outerAngle` and `projectionPlaneDistance`. The TODO's claim that the
collector row has no cone fields may no longer hold, which changes how much of a
bridge is actually needed. Spot lights are the hard case either way.

## Also open, unrelated to smart lights

**Shadow acne.** Bias is NOT missing: `Tw2CarbonShadowRenderer.casterDepthBias = 2`
and `casterSlopeBias = 2`, enabled with `POLYGON_OFFSET_FILL` and flushed through
`gl.polygonOffset`. So widening the Carbon render-state allowlist is NOT the fix -
that idea is dead. The lead is the SIGN: Carbon's own shadow passes declare
`Shadow` +1.0/+1.0 and `DynamicLightShadow` **-6.0/-1.0**, decoded from the
container. Ours is +2/+2. On a reversed-Z axis "away from the light" flips sign,
the same shape as the decal `+1e-5` lift. A/B live, both are plain fields:

```js
const r = scene._carbonShadowRenderer;
r.casterSlopeBias = -2; r.casterDepthBias = -2;
```

If positive values only ever trade acne for detached shadows, the sign is wrong;
if larger positives clean it up, it is just under-biased for EVE's scene scale.
The separate "resolve pass is the missing piece" problem and depth precision at
scene scale are NOT the same issue and could produce the flicker independently.

**dist provenance.** `dist/` is committed and built from the WORKING TREE, and
skindr vendors it by copy to `e:\skindr\web\vendor\ccpwgl2_int.js`. A transient
state in anyone's tree gets captured and shipped onward with no provenance stamp.
This already bit us: a fail-hard `throw` in render target creation lived in a
bundle for ~5 minutes, skindr's copy was taken inside that window, and it read as
"lights, sprites and beams are all broken" while cppc was fine. **Compare the
artefacts before theorising about the code.**

**Uncommitted, not mine**: `src/runtime/character/TnyCharacterAppearanceManager.js`,
`gles/TnyGlesAtlasComposer.js`, `gles/TnyGlesCharacterAdapter.js` - atlas scale
knob and head domain reuse. They are baked into the pushed bundle with no matching
committed source.
