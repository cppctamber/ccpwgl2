# ccpwgl notes: emulated texture addressing (2026-08-11)

Commit `13b9a598`. Companion to `runtime-resource` `2d4a9c0` and `b4a9c98`,
which own the emitter half.

## What it does

WebGL2 does REPEAT, MIRRORED_REPEAT and CLAMP_TO_EDGE natively. It has **no**
CLAMP_TO_BORDER — that lives in `EXT_texture_border_clamp`, which our desktop
contexts do not expose — and **no** MIRROR_ONCE. Those two are emulated in the
translated GLSL, and the mode is read at runtime from a constant buffer the
emitter declares (`cb8` by default).

Three pieces here:

- `Tw2Effect._ApplyEmulatedAddressing` uploads the buffer in `ApplyPass`.
- `Tw2ShaderProgram.SetupCarbonResources` records which register it is.
- `Tw2SamplerState.WrapModes[5]` gets a distinct value.

## The thing to understand before touching it

**Read the sampler that GL is actually given, not the pass sampler.**

`Tw2TextureParameter.Apply` applies the parameter's own overrides over whatever
sampler it is handed:

```js
if (this.overrides) sampler = this.overrides.GetSampler(sampler);
```

That is the mechanism. An override on a texture parameter reaches GL through
`Apply`, *not* through `Tw2Effect.samplerOverrides` — `BindParameters` resolves
only the latter, so `tex.sampler` is the mode **before** any parameter override.

The upload therefore resolves the same way `Apply` does. Reading `tex.sampler`
alone produces a very specific and confusing symptom: wrap, mirrored repeat and
clamp-to-edge all work (GL honours them from the overridden sampler), while
border and mirror-once silently do not — because only those two depend on the
buffer. Two days were nearly spent on this; if border is not applying, check this
first.

## Mode encoding

Trinity enum as stored: `1` wrap, `2` mirror, `3` clamp-to-edge, `4` border,
`5` mirror-once. **`0` means "nothing to emulate"** and is what every failure
produces — a zeroed buffer, an absent upload, a texture the consumer did not know
about. Carbon's enum starts at 1 and no shipped sampler carries 0, so 0 cannot
swallow a real mode; failures degrade to today's behaviour rather than to a new
wrong one.

## WrapModes[5]

Was `GL_CLAMP_TO_EDGE`, now `GL_MIRROR_CLAMP_TO_EDGE` (`0x8743`). `addressUMode`
is `WrapModes.indexOf(addressU)`, so sharing a value made mode 5 read back as
mode 3 — mirror-once was indistinguishable from clamp-to-edge *everywhere
downstream*, erased before any consumer could act on it. `resolveWrap` flattens
both emulated modes at the GL boundary so neither reaches a driver.

Note there is no path to mirror-once from pattern data: `ToAddressMode` maps
`2→4` and `1→3` with everything else falling to wrap, mirroring Carbon's
`GetTextureAddressMode`, which has no MIRROR_ONCE case either. It is reachable
only by setting the mode directly.

## The buffer is identified by register, deliberately

The binding carries no marker field. `cjsSemantic` is reserved vocabulary for the
local-light family and the block writer throws on any other value, and the wire
drops fields it does not encode — an invented marker would vanish for every
effect loaded from bytes, which is exactly how the packed-light branch came to be
silently dead. Carbon declares only `cb0-4`, `6` and `7` across all 537 shipped
effects, so a constant buffer at 8 or above is the emitter's.

## Still to do

- **The 21 hand-written shaders** in `src/toDeprecate/shaders/` (40 call sites)
  still read the legacy per-mask border flags at `cb4[10].yz` / `cb4[11].yz`.
  Moving them to `cb8` gives one consumer path instead of two and gets them
  mirror-once for free.
- **`runtime-resource` in `node_modules` is a hand-patched copy** of 0.16.0 —
  built from source and copied over. Any `npm install` reverts it and the demo
  silently loses the emitter half. It needs a real publish.

## Unrelated findings, recorded elsewhere

Two regressions found while testing, neither caused by this work, both written up
in the org `.agents/` notes: Eve child modifier billboarding (a sign flip, with
measurements — do **not** fix by reverting), and ambient occlusion ignoring light
emitters.

Also worth knowing: **gles2 + the depth tier cannot work.** The depth variants are
packed-texture shaders and reference textures the gles path does not have, so the
hull renders black. It presents as a rendering bug rather than a missing resource.
`DeviceShaderQuality.HIGH` is `"depth"`, `MEDIUM` is `"hi"` — the naming invites
exactly this.
