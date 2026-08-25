# Material picking — handover for the skindr agent, 2026-08-25

You want: a user drags an icon or pattern over the 3D ship, and on drop you need
to know **what they dropped it on** — which material layer, and which mesh area.

## STOP — do not build against this yet

**`Tw2MaterialPicker` does not work.** A review found it never substitutes the
picking shaders: `Render()` collects the ship's own effects, so it would draw an
ordinary picture of a ship into the buffer and `Pick` would decode nonsense out
of it. Several other pieces are missing too — per-area constants, camera setup,
colour-mask handling.

I wrote most of this handover before that review, and the API below is the
intended shape rather than a working one. **Wait for a message saying the picker
runs.** Everything about the ENCODING and the SHADERS is real and tested, so the
rest of this document stays useful as the contract you will be coding against —
just do not expect a call to return a right answer today.

The full list of what is missing is in the class header of
`src/picking/Tw2MaterialPicker.js`.

---

It is in ccpwgl `master` at `62969033`, and the bundle at
`skindr/web/vendor/ccpwgl2_int.js` is up to date, so there will be nothing to
build when it does land.

**Read the first three sections before writing code.** The rest is reference.

---

## 1. The shape that fits your drag

You said the ship cannot move while the user is dragging. That is exactly the
right observation, and the API is built around it: **one render answers the
whole gesture**.

```js
picker.SetSize(width, height);

// Renders once on the frame the scene next finishes, then answers every
// coordinate from that one buffer. Settles when the image exists and has been
// read, so there is no "render now" for you to call at the wrong moment.
const results = await picker.PickAsync(scene, ship, [ [ x1, y1 ], [ x2, y2 ] ]);
```

One result per coordinate, in order. Cleanup is unconditional — the object
reference is released whether the pick succeeds, finds nothing, or throws.

It rides the **scene**, not a raw animation frame: queued through
`scene.EnqueueTask` and run by `EveSpaceScene.RunPendingTasks` after the scene
has finished drawing and before the next frame starts. An offscreen pass that
reads its own result needs the frame's state settled and must leave no trace
behind, and that hook gives it both.

Each call costs one render, so batch the coordinates you care about into one
call rather than calling per mouse-move.

`Render()` and the synchronous `Pick(x, y)` still exist, but they are the sharp
edges — `Pick` is only meaningful after a successful `Render` in the same frame.
Use `PickAsync`.

**Re-render if anything changes**: camera move, ship rotate, SKINR values
change, LOD change. Each `PickAsync` call renders afresh, so this only matters
if you cache results yourself.

## 2. Coordinates — Y IS FLIPPED

`Pick(x, y)` takes **buffer pixels with a BOTTOM-LEFT origin**, because that is
what `readPixels` uses. A mouse event is top-left origin. Converting yourself is
the most likely way to get a plausible-but-wrong answer, so use the helper
ccpwgl already has:

```js
const coords = tw2.math.vec2.pixelPositionFromEvent([], event, canvas);
const hit = picker.Pick(coords[0], coords[1]);
```

It also handles the CSS-size vs canvas-size scaling, which bites whenever the
canvas is not displayed at its backing resolution.

If you must do it by hand:

```js
x = cssX * canvas.width / canvas.clientWidth;
y = canvas.height - cssY * canvas.height / canvas.clientHeight - 1;
```

## 3. What you get back

```js
{
  hit: true,
  material: 3,              materialName: "MTL3",
  shaderKind: 1,            shaderKindName: "QUAD",
  areaType: 0,
  areaIndex: 17,
  isSelectable: true,
  isDefect: false,
  color: [ 51, 1, 17 ]
}
```

`hit: false` means the background — everything else is null. The background is
solid green, and the test is on the material bits, not alpha.

**Three fields you must not ignore:**

- **`isSelectable: false`** — the user dropped on `PAINT`. That region is
  "material −1": its colour comes from the authored albedo texture, not from
  data, so **a user cannot recolour it**. Report the drop as landing on the hull
  but refuse the edit, rather than silently applying nothing.
- **`isDefect: true`** — the pixel was drawn but reported shader kind `UNKNOWN`.
  That is a BUG on our side, not a user action: a shader with no picking
  equivalent. Right now that is expected for nine of the ten quad kinds (see
  §5). Log it and treat as a miss; tell us which ship.
- **`areaIndex` + `areaType`** — different mesh areas treat the same material
  slot differently, so `MTL3` on area 4 is not `MTL3` on area 9. If you are
  applying an edit, key it on the area too.

## 4. Materials

```
0  NONE (background)   5  PMTL1     8   DETAIL1
1  MTL1                6  PMTL2     9   DETAIL2
2  MTL2                7  PAINT     10  DETAIL3
3  MTL3
4  MTL4
```

`DETAIL1..3` are reserved and not emitted yet. `PAINT` is emitted but not
selectable. **`11 DECAL`** is a decal rather than a material layer — see below.

## 4b. Decals

A decal is separate geometry drawn over the hull, not a layer of it, so it
reports its own material id:

```js
{ material: 11, materialName: "DECAL",
  shaderKindName: "DECAL_GLOW",   // which decal shader drew it
  areaIndex: 5,                   // which decal
  isSelectable: true }
```

**This matters for your drag.** A user dropping an icon onto a ship is very
likely aiming at or near a decal — a corp logo, a nameplate — and you need to
know whether they hit the decal or the hull under it. `material === 11` is that
answer, and `areaIndex` says which decal.

All six plain decal kinds are covered: `DECAL`, `DECAL_COUNTER`,
`DECAL_CYLINDRIC`, `DECAL_GLOW`, `DECAL_GLOW_CYLINDRIC`, `DECAL_HOLE`.

Two behaviours worth knowing:

- **Decals discard where transparent.** Coverage is `DecalTransparencyMap`, so a
  small logo on a large decal quad picks as the logo, not the rectangle. Where
  the decal is transparent, the hull underneath wins the pixel — which is what a
  user expects.
- **Intensity is deliberately ignored.** The shipped shader fades a decal by an
  intensity value; picking does not apply it, because a faded decal is still
  exactly where it was and a drop on it should still find it.

The decal coverage cut uses the PATTERN threshold (`threshold[1]`), since decal
coverage is a plain 0..1 mask of the same shape as a pattern mask.

**`PMTL2` cannot occur under two blend modes.** With
`BLEND_MODE_SUBTRACT` and `BLEND_MODE_EXCLUSION`, the shipped shader collapses
both pattern masks into a single weight applied to pattern one's slot and never
touches pattern two's — so there is no second pattern layer to hit. That is the
engine's behaviour, not a limitation here. Do not offer PMtl2 as a target under
those modes.

## 5. What is NOT done yet — read this before you debug

**Only `quadv5` has a picking shader among the QUADS.** All six DECAL kinds are
done. The other nine quad kinds — `quaddetailv5`,
`quadglassv5`, `quadheatv5`, `quadsailsv5`, `quadwreckv5`,
`quadenvironmentv5`, `quadoilv5`, `quadinstancedv5`, `quadheatdetailv5` — do
not, so surfaces drawn with them will not appear in the buffer at all, or will
report `isDefect`.

So on a real hull **expect gaps**. A ship is rarely one kind throughout. If a
region of a ship never picks, that is very likely this and not your code — say
which ship and which region and we will do that kind next.

Also missing:

- **Highlight shaders.** `MaterialHighlight [mtl1..mtl4]` and
  `PatternMaterialHighlight [pmtl1, pmtl2, ...]` are designed but not written.
  When they land they share the same resolution code as the picker, so a
  highlight can never disagree with a pick.
- **Detail map layers** are reserved in the encoding but not emitted.
- **Nothing has been verified in a frame.** The resolution rules and the
  encoding are unit tested; no hull has been rendered through this yet. You may
  well be the first, so treat surprising results as ours until shown otherwise.

## 6. The gradient control, if a drop feels off-by-a-bit

Material selection is a single scalar with four materials anchored at 0, ⅓, ⅔, 1
and a triangular weight each. Those tents **overlap across 94% of the interval
between anchors**, so most texels are genuinely a blend of two materials. Which
one a drop reports is therefore a decision, not a lookup.

```js
picker.threshold = [ material, pattern, paint, 0 ];   // default [0.5, 0.5, 0.5, 0]
```

Each value is where the boundary sits along a gradient: `0.5` is the even split,
lower and higher shift which side claims more. If users report drops landing on
the neighbouring layer near a boundary, this is the knob — tell us which
direction felt wrong and we will confirm the sense of it, because the convention
has not been checked against a human yet.

## 7. Reference

- Design and the shader extraction: `NOTES-material-picking-2026-08-25.md`
- Encoding, enums, decoder: `src/picking/pickingEncoding.js` — plain JavaScript,
  importable, no decorators
- The picker: `src/picking/Tw2MaterialPicker.js`
- Shared GLSL resolution: `src/picking/shaders/materialResolve.js`
- Tests: `npm run test:material-picking`

The encoding, for when you are staring at a buffer:

```
R  low nibble  material      high nibble  area type
G  shader kind (0 = UNKNOWN = a bug; quads 1-10, decals 11-16)
B  area index
```

Displaying the buffer is a legitimate debugging move — every channel is readable
by eye, which is why the fields were not split across channels.
