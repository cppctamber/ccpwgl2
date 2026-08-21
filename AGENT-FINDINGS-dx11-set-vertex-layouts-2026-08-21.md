# dx11 vs gles2: attachment set vertex layouts - 2026-08-21

Operator report: plane sets and instanced geometry render on `effect.gles2` but
not on `effect.dx11` (which routes through webgl2). Every attachment that builds
its own vertex buffer has been compared against Carbon. Diagnosis only; NOT fixed.

Ground truth: each set's static `Tr2VertexDefinition` under
`e:\carbonengine\trinity\trinity\Eve\SpaceObject\Attachments\**`.

## Mechanism

These attachments build their own vertex buffer and declaration in JS, then bind
it by matching that declaration against the shader's declared inputs
(`Tw2VertexDeclaration.SetPartialDeclaration`). The match is a merge-walk over
both lists sorted by `usage`/`usageIndex`. When the shader declares an input the
buffer does not supply, the walk does:

```js
gl.disableVertexAttribArray(el.location);
gl.vertexAttrib4f(el.location, 0, 0, 0, 0);
```

No throw, no warning - the attribute is silently fed zeroes. The legacy gles2
shaders were authored against ccpwgl's layouts, so gles2 is unaffected; Carbon's
dx11 shaders were authored against Carbon's, so any stream we do not publish
arrives as zero.

The usage ENUM is NOT the problem: `Tw2VertexElement.Type` already agrees with
Trinity (TEXCOORD=5, COLOR=1) and the one legacy divergence
(BLENDWEIGHT/BLENDINDICES swapped) is translated at the readers. What differs is
which semantic index each stream is published under, and how many components it
carries.

## Results

| Attachment | Verdict |
| --- | --- |
| EvePlaneSet | **MISMATCH** - missing TEXCOORD 8 |
| EveSpotlightSet | **MISMATCH** - missing COLOR 1, and TEXCOORD 4 is the wrong shape |
| EveHazeSet | minor - TEXCOORD 7 carries 3 components where Carbon has 4 |
| EveSpriteSet | match |
| EveBoosterSet / EveBoosterSet2 | match |
| EveTrailsSet | match |
| EveSpaceObjectDecal | no hand-built layout - uses the mesh declaration |
| EveBannerSet | not compared - Carbon builds one, ccpwgl has none (see below) |
| EveCurveLineSet | no Carbon counterpart to compare against |

### EvePlaneSet - MISMATCH (`EvePlaneSet.cpp:154-168` vs `EvePlaneSet.js:510-522`)

Carbon's declaration maps 1:1 onto its `PlaneVertex` struct (`cpp:45-60`):

| Semantic | Carbon field | ccpwgl |
| --- | --- | --- |
| TEXCOORD 0/1/2 f32x4 | transform1/2/3 | same |
| COLOR 0 f32x4 | color | same |
| TEXCOORD 3/4/5/6 f16x4 | layer1Transform, layer2Transform, layer1Scroll, layer2Scroll | same |
| **TEXCOORD 8 f16x4** | **blinkData** | **ABSENT** |
| TEXCOORD 7 ubyte4 | index, boneIndex, maskMapAtlasIndex, pickBufferID | TEXCOORD 7 x3 - no pickBufferID |

So the layouts agree on everything except that ccpwgl never publishes
`blinkData`. On dx11 the shader reads it as (0,0,0,0). ccpwgl's `vertexSize` is
35 floats (8x4 + 3), which is exactly Carbon's minus the four blink components.

Note ccpwgl expands each plane to four vertices with an index buffer rather than
instancing it as Carbon's quad renderer does. That is a legitimate difference of
strategy and not itself a bug - only the semantics have to line up.

### EveSpotlightSet - MISMATCH (`EveSpotlightSet.cpp:22-29,40-47` vs `EveSpotlightSet.js:645-652`)

Carbon carries TWO declarations. The fuller one:

```
TEXCOORD 4  f32x1   PER-VERTEX (divisor 0)  - the corner index
TEXCOORD 0  f32x4   per-instance
TEXCOORD 1  f32x4   per-instance
TEXCOORD 2  f32x4   per-instance
COLOR    0  f16x4   per-instance
COLOR    1  f16x4   per-instance
TEXCOORD 3  f16x4   per-instance
```

The second variant drops COLOR 1 and narrows TEXCOORD 3 to f16x2.

ccpwgl publishes a single stream: COLOR 0 x4, TEXCOORD 0/1/2 x4, TEXCOORD 3 x3,
TEXCOORD 4 x3. Two faults: **COLOR 1 is never published**, so it zero-fills on
dx11; and TEXCOORD 4 is a 3-component per-instance value where Carbon has a
1-component per-vertex corner index.

### EveHazeSet - minor (`EveHazeSet.cpp:133-145` vs `EveHazeSet.js:359-367`)

Semantics agree exactly (TEXCOORD 0..6, COLOR 0, TEXCOORD 7) and neither side
instances. Only the last stream differs: Carbon UBYTE_4, ccpwgl 3 floats, so the
w component arrives as GL's default 1.0 instead of the packed fourth byte.
Whether that matters depends on the shader reading `.w`.

### Matches - ruled out

- **EveSpriteSet** (`EveSpriteSet.cpp:24-30`): per-vertex TEXCOORD 5 f32x1, then
  per-instance POSITION 0, TEXCOORD 0, TEXCOORD 1, COLOR 0, COLOR 1. ccpwgl has
  exactly this - the per-vertex decl at `EveSpriteSet.js:225` and the instanced
  one at `:713-719`, COLOR 1 included. (The older layout at `:698-707` is a
  separate non-instanced path and is not what the instanced draw uses.)
- **EveBoosterSet / EveBoosterSet2** (`EveBoosterSet2.cpp:1014-1027`): per-vertex
  POSITION 0 + TEXCOORD 0, then per-instance TEXCOORD 1..5 x4, TEXCOORD 6 x1,
  TEXCOORD 7 x2. ccpwgl matches element for element, and
  `unsupported/EveBoosterSet2.js` even reproduces the per-vertex/per-instance
  split correctly.
- **EveTrailsSet** (`EveTrailsSet.cpp:143-152`): Carbon takes the MESH's
  declaration and appends TEXCOORD 1 f32x4 at divisor 1. ccpwgl does the same
  (`EveTrailsSet.js:294`).
- **EveSpaceObjectDecal**: no static layout; it reads the mesh's own declaration
  and locates instance transforms by `Find(TEXCOORD, 0..2)`.

### Not compared

- **EveBannerSet** (`EveBannerSet.cpp:370-379`): Carbon builds POSITION f32x3,
  NORMAL f16x4, TEXCOORD f16x2, BLENDINDICES byte4. ccpwgl has no corresponding
  declaration - banners appear to go through the ordinary mesh path. Worth
  confirming separately, since banners are already known to be fragile.
- **EveCurveLineSet**: ccpwgl declares POSITION 0, TEXCOORD 0/1/2, COLOR 0/1/2
  (`EveCurveLineSet.js:1505-1511`). Carbon's `Eve/UI/EveCurveLineSet.cpp` builds
  no vertex definition, so there is nothing to compare it against; its dx11
  behaviour has to be judged by running it.

## Why it is invisible

Nothing reports a mismatch. `SetPartialDeclaration` zero-fills silently, and
`buildInputDefinition` (`Tw2CarbonEffectReader.js:346-383`) skips any pipeline
input whose `usedMask` is 0, so the shader's input list is already a filtered
view. **A one-shot per-effect log naming every declared input that got
zero-filled would have made this immediate, and is worth adding regardless of the
fix** - it is the diagnostic this whole class of bug lacks.

## Fix shape (not implemented)

Only two sets need work, and both need the declaration AND the buffer writer
changed together - publishing the right semantics over the wrong bytes renders
something plausible-but-wrong, which is worse than rendering nothing.

1. **EvePlaneSet**: add `blinkData` as TEXCOORD 8 (4 components, taking
   `vertexSize` from 35 to 39) and widen TEXCOORD 7 to 4 to carry
   `pickBufferID`. Source the blink values from the item; check what
   `EvePlaneSetItem` already exposes before inventing fields.
2. **EveSpotlightSet**: publish COLOR 1, and move the corner index to its own
   per-vertex stream at TEXCOORD 4 with divisor 0, matching Carbon's split.

Both are per-set constants plus their writers, so they can be done independently.
Verify on `chjita:caldaribase:caldari`, which carries plane and spotlight sets,
and compare the two profiles side by side rather than judging dx11 alone.
