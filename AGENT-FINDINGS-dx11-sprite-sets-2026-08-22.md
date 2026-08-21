# dx11 sprite sets - investigation, 2026-08-22

Operator report: sprite sets broken. They were taken out for a while by a real
fault of mine (the `vec4.createLinear` throw, fixed in 038e70cc, which aborted
`SetupSpriteSets` and everything after it in `Build`), but they are still wrong
with that fixed, so there is a second cause. Operator's hypothesis: depth.

Nothing below is fixed. This records what has been RULED OUT with evidence, so it
is not re-derived.

## Ruled out

**A missing shader.** `blinkinglightspool` exists on BOTH profiles - gles2 4718
bytes, dx11 3875 - at every quality tier (`sm_hi`, `sm_lo`, `sm_depth`). The
resfileindex listing of
`res:/graphics/effect.dx11/managed/space/spaceobject/fx/` has 15 unique shaders
and gles2 has 14; nothing in gles2 is absent from dx11.

**The raw effect path.** `SetupSpriteSets` assigns `options.effect.sprite`, built
from `effectPath.spriteSet` WITHOUT `GetShaderPath`, so it never receives the SOF
shader prefix. That looks wrong beside plane sets, which do
`data.GetShaderPath(effectPath.plane, isSkinned && srcSet.skinned)` - but it is
correct here, and running it through `GetShaderPath` would BREAK it:

- there is no `skinned_blinkinglightspool` on either profile (404), and no
  non-pooled `blinkinglights` either - confirmed against the index and by the
  operator;
- the spotlight POOL branch does exactly the same thing, taking
  `spotlightConePool`/`spotlightGlowPool` raw while only the non-pool branch
  calls `GetShaderPath(..., set.skinned)`.

Raw-for-pooled is the established pattern. Do not "fix" this.

**Depth, at least in the shader.** The dx11 vertex stage carries the reversed
tail as expected:

```
gl_Position.z = dot(vec4(r0.xyzw), vec4(cb1[14].xyzw));
gl_Position.z = gl_Position.w - 2.0 * gl_Position.z;    // depthRange "reversed"
gl_Position.z = 2.0 * gl_Position.z - gl_Position.w;    // depthRange "forward"
```

Per `Tw2CarbonData` (`GlClipToCarbonClip`), that tail composed with the engine's
GL-to-Carbon clip conversion is the IDENTITY for an unbiased vertex. So the
shader half is right. What is NOT verified is whether the sprite draw receives the
engine half - see below.

**The vertex semantics.** The dx11 shader declares four inputs:

```
in_POSITION0, in_COLOR0, in_TEXCOORD0, in_TEXCOORD1
```

The legacy gles2 pool shader declares five, the extra being `TEXCOORD 5` (1
component) - the per-vertex quad corner index
(`toDeprecate/shaders/other/blinkinglightspool.js:13-17`). Its absence on dx11 is
expected, not a fault: the DXBC almost certainly takes the corner from
`SV_VertexID`, which the translator turns into `gl_VertexID`, and ccpwgl draws
`drawArraysInstanced(TRIANGLES, 0, 6, itemCount)` so the ids are 0..5.

ccpwgl supplies per-vertex `TEXCOORD 5` and per-instance POSITION 0 (3),
TEXCOORD 0 (4), TEXCOORD 1 (2), COLOR 0 (4), COLOR 1 (4) = 17 floats, matching
its declared stride of `17 * 4`. Every semantic the dx11 shader wants is supplied
at the right divisor; the two extras (TEXCOORD 5, COLOR 1) simply do not bind.
This is NOT the plane set's `TEXCOORD 8` failure - nothing is being zero-filled.

## Still open, in the order worth checking

1. **Does the pooled sprite draw get the Carbon per-frame data?** The shader's
   reversed tail only cancels if the engine supplies a projection converted by
   `GlClipToCarbonClip`. If the pooled sprite path draws without the Carbon
   per-frame constant buffer that conversion lives in, the tail is UNMATCHED and
   depth inverts - which `Tw2EffectRes.js:340-351` describes exactly, for the
   spotlight beams, as "the quad being occluded by everything instead of drawing
   in front". That is the operator's hypothesis and it is still live; what is
   disproved is only that the shader itself is wrong.

   Cheap A/B, already built in: set `tw2.device.effectDepthRange = "forward"` and
   RELOAD (it is read at effect load, so a live change does nothing on its own).
   If sprites appear, it is this.

2. **The constant buffer contents.** The dx11 shader needs vertex `cb1` and pixel
   `cb2` plus one texture (`s0`/resource 0). The shared ccpwgl sprite effect sets
   only `MainIntensity` and `GradientMap`. Whether those land in the right Carbon
   constants has not been checked.

3. **No sprite pool toggle.** There is `useSpotlightPool` but no sprite
   equivalent: `SetupSpriteSets` hardcodes `set.useQuads = true`, so sprites
   always take the pooled path with no fallback, while spotlights have one. Since
   spotlights render and sprites do not, that asymmetry is suggestive - but note
   there is no non-pooled sprite shader to fall back TO, so a toggle would need
   the non-quad path to build its own geometry.

## Method note

The container reads through
`CjsWebglFormat.buildEffect(bytes, { source, localLights: "packed-texture",
emitterOptions: { depthRange } })` and then `CjsWebglFormat.read(built.bytes)` -
`read()` alone fails on a raw file with "Invalid string-table offset", because
the DXBC has not been translated yet. The dx11 file is a Carbon v15 container
(`0f 00 00 00`); the gles2 file is legacy v8 (`08 00 00 00`) and this reader
cannot open it at all.

---

# RETRACTED - the fog volume is NOT the cause (see correction at the end)

The dx11 pooled sprite shader takes NO material textures and NO parameters. Both
constant buffers report `constants: []`, and its ONLY resource is an
auto-registered scene global, a `sampler2DArray`:

    metadataName: "EveSceneFogVolumeMap"
    carbon: { name: "EveSceneFogVolumeMap", type: 5, isAutoregister: true }
    annotations: [{ name: "AutoRegister", boolValue: true }]

The pixel shader ends:

```glsl
r0.x = textureLod(s0, vec3(r1.xyw), 0.0).w;   // fog volume, one slice
r0.y = textureLod(s0, vec3(r1.xyz), 0.0).w;   // fog volume, another slice
r0.x = (-r0.y) + r0.x;                        // the DIFFERENCE between them
...
SV_Target0.xyzw = r0.xxxx * r1.xyzw;          // whole output scaled by it
```

ccpwgl supplies `EveSceneFogVolumeMap: "dynamic:/colorarray/0,0,0,0"`
(`config.js:583`). `colorarray/r,g,b,a[,layers]` rasterizes a 1x1xN array in which
EVERY LAYER IS THE SAME COLOUR (`Tw2ColorTextureRes`), so two samples of it differ
by exactly zero whatever colour is chosen. The sprite output is multiplied by 0,
every sprite renders pure black, and under additive blending black is invisible.

That matches the symptom exactly, including the observation that ruled depth out:
sprites stay invisible with the MESH DISABLED, because nothing is occluding them -
they are being drawn, in black.

Profile-specific because the legacy gles2 v8 shader has no fog-volume term.

## What the fix needs

NOT a value change. No constant colour can work, because the shader reads a
DIFFERENCE between slices. The placeholder has to vary per layer, so the options
are: extend the dynamic texture syntax to express a per-layer ramp; supply a real
fog volume; or decide what "no fog" means for this encoding - if the volume stores
accumulated transmittance, the difference across the segment should be 1, not 0.

Which is right depends on Carbon's fog volume encoding, NOT established here. Do
not guess a value: a wrong one is either equally invisible or blows the sprite out.

This will affect every dx11 shader carrying the same fog term, not only sprites.
Grep the dx11 corpus for EveSceneFogVolumeMap consumers before choosing a fix.

---

# CORRECTION - both of the above "root causes" were wrong

Recorded in full because each looked convincing and would waste someone's day.

## 1. The fog volume is fine

The claim was that the sprite output is scaled by the DIFFERENCE of two fog
slices, so a flat placeholder zeroes it. That read stopped one line too early.
The full sequence is:

```glsl
r0.x = (-r0.y) + r0.x;         // difference between the slices
r0.x = r0.z * r0.x + r0.y;     // interpolate between them
r0.x = (-r0.x) * r0.w + 1.0;   // fog FACTOR = 1 - fog
```

With an all-zero volume that is `1 - 0 = 1.0`, i.e. full brightness.

Carbon agrees: `Tr2VolumetricsRenderer::GetEmptyVolumetricTexture` builds a
1x1, 4-slice R8G8B8A8_UNORM array that is ALL BLACK - the same thing ccpwgl
supplies via `dynamic:/colorarray/0,0,0,0`. Had the difference reading been
right, Carbon's own sprites would be black too. That cross-check is what caught
it, and it is the check that should have been made before claiming a cause.

## 2. The vertex packing is fine

The claim was that ccpwgl writes `world[8]`, `world[9]`, `world[10]` into the
slots the shader reads as activation, blinkRate and falloff. Those writes are
real, but they are in `RenderBoosterGlow` - the BOOSTER path, not the sprite one.

`Render` routes `useQuads` to `RenderQuads`, which writes:

```
worldPosition[3], 1, blinkPhase, blinkRate, minScale, maxScale, falloff,
color[3], 1, warpColor[3], 1
```

Against Carbon's `EveSpriteSet::PoolVertex` (`EveSpriteSet.h:55-68`):

```cpp
Vector3 position; Float_16 activation, blinkPhase, blinkRate, minScale,
maxScale, falloff; uint32_t color, warpColor;
```

Field for field, including the hardcoded activation of 1. It matches.

## What is now verified as CORRECT

Shader exists on dx11; effect path; vertex semantics and divisors; the 17-float
stride; the instance field packing; the reversed-depth tail; the fog term. None
of these is the fault.

## What has NOT been checked

- Whether the sprite draw receives the Carbon per-frame constant buffer at all.
  The vertex shader reads `cb1[10]`, `cb1[12..15]` (view-projection) and
  `cb1[45].x` (the animation clock). If `cb1` is not populated for this effect,
  the quad is projected by a zero matrix and collapses - which looks exactly like
  "invisible", and unlike the theories above it has not been tested.
- Whether `_visibleItems` is non-empty at draw time. `SetupSpriteSets` sets
  `display = false` on any item whose faction colour resolves to black, and the
  fallback that would have rescued an unknown colorType is COMMENTED OUT
  (`srcItem.colorType = HasColorType(...) ? ... : 0`). If the caldari faction
  lacks a sprite colorType the hull uses, every item is disabled and no batch is
  ever queued. This is cheap to check in the client and is the first thing to
  look at.

Method note for next time: confirm the code path is the one actually executed
before reading its contents as evidence, and sanity check any proposed cause
against Carbon doing the same thing successfully.

---

# CURRENT STATE - dx11 shader override

The sprite EFFECT PATH pin to `/effect.gles2/` has been REVERTED. It made sprites
appear, but they drew THROUGH hull geometry, and it left the engine loading a
gles2 container while running the dx11 profile - a second divergence stacked on
the first.

Replaced by a manual shader override, which is what `src/toDeprecate/shaders`
exists for. `blinkinglightspoolDx11` registers the existing hand written pool
shader against `graphics/effect.dx11/.../blinkinglightspool`; the store keys
overrides on the profile-qualified path, so each profile needs its own entry. The
technique body is SHARED BY REFERENCE with the gles2 entry, not copied, so the two
cannot drift.

The effect path is ordinary and unqualified again, so the profile stays honest,
and because the definition is now ours, render states can be stated in it if the
depth behaviour needs correcting - the format supports `states`, as
`boostervolumetric` does.

## Depth, if it recurs

Under the pin the sprites drew through geometry. Four explanations were checked
and NONE held, so do not reach for them again:

- the fog volume term (resolves to 1 against an all-zero volume, and Carbon's own
  empty volume is all-zero);
- the instance packing (matches `EveSpriteSet::PoolVertex` field for field);
- the clip conversion reaching legacy shaders (`PackPerFrameVS` writes into a
  SEPARATE Carbon copy; the legacy `gles` buffer is untouched);
- a stale legacy per-frame buffer (`perFrameVSData` is a device field the scene
  updates regardless of profile).

`RM_ADDITIVE` sets `ZENABLE 1`, `ZWRITEENABLE 0`, `ZFUNC LEQUAL`, so the depth
test IS on and the sprites' z was comparing as nearer than it should.

The unexplored direction, and the one to take next, is whether this is
sprite-specific at all: ccpwgl already has a recorded dx11 depth/render-state gap
(the dx11 path dropping per-pass render states) and an open
"distortion-over-opaque" lead. An additive draw appearing over opaque hull is the
same shape. The discriminator is cheap - check whether ANY other additive
attachment (a spotlight glow, a plane set) also draws through hull geometry on
dx11. If they do, this is that gap and not a sprite problem.
