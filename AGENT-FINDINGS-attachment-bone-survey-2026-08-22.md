# Attachment bone survey - `src/eve/item/`, 2026-08-22

Read-only survey, transcribed. Everything is verified by reading the cited lines
unless marked *inferred*.

Context: the plain accessor (`GetTransform`, `GetBoundingBox`,
`GetBoundingSphere`, `GetDirection`) must always return the bone-aware answer -
callers should never have to know whether a thing is animated. `EveBanner` has
been converted and its `GetSkinned*` family DELETED; `GetLocal*` remains as the
explicit escape hatch.

## Who folds the bone in

| Class | `_bone`? | assigned from | Transform | BoundingBox | Direction |
| --- | --- | --- | --- | --- | --- |
| `EveBanner` | yes | `bones.find(x => x.index === boneIndex)` in `UpdateViewDependentData` | bone-aware | bone-aware | bone-aware |
| `EveSpriteSetItem` | yes | `parent.GetBone()` on rebuild | bone-aware | bone-aware (via sphere) | - |
| `EvePlaneSetItem` | yes | `parent.GetBone()` on rebuild | bone-aware | bone-aware | - |
| `EveSpotlightSetItem` | yes | `parent.GetBone()` on rebuild | bone-aware | bone-aware | - |
| `EveCurveLineSet` (the SET) | yes | positional `bones[boneIndex]` | bone-aware | union of items | - |
| `EveLocatorSetItem` | yes | positional `bones[boneIndex]` | bone-aware | - | - |
| `EveLocator2` | yes | `FindMeshBoneByName` | bone-aware | bone-aware | **RAW - outlier** |
| `EveTurretSetItem` | yes | pushed in by the set (`item._bone = bone`) | **bone-aware by another route** | same | - |
| `EveBoosterSetItem` | **no** | - | raw | raw | raw |
| `EveSpaceObjectDecal` | **no `_bone`** | joint matrices, per frame | bone-aware | - | - |

## The turret is NOT an outlier - do not "fix" it

`EveTurretSetItem`'s accessors return `_localTransform` raw, but `_localTransform`
is itself bone-derived: `UpdateTransforms` overwrites `rotation`/`position` from
`this._bone.worldTransform` - NOT `offsetTransform` - and the render path calls it
every frame. Composing `offsetTransform` on top would DOUBLE-APPLY the bone.

It is also the only class using `worldTransform` rather than `offsetTransform`,
and its `_bone` is pushed in from outside rather than pulled via `GetBone`, so
`boneIndex` is unused for turrets.

## Genuine outliers, in priority order

1. **`EveLocator2.GetDirection`** reads columns straight off `this.transform` while
   `GetTransform` and `GetBoundingBox` fold the bone. Same for `GetTranslation`,
   `GetWeaponRotationTranslation` and hence `GetGlowTranslation`. So a skinned
   booster or turret locator reports a bone-correct BOX and a stale DIRECTION and
   POSITION. This is the clearest violation of the rule.
2. **`EveBoosterSetItem` is not bone-aware at all**, and it is fed from the
   locator's RAW `transform` field (`mat4.copy(item.transform, transform)`), so
   even the locator's own bone is dropped on the way in. `EveBoosterSet` also calls
   `super.UpdateViewDependentData(parentTransform, null)`, so `_bones` is
   permanently null and `GetBone()` could not work even if asked. Its sprite glows
   DO receive the real bones array - so the glows are bone-aware while the
   boosters they belong to are not.
3. **Decal `GetWorldTransform`** ignores `_offsetTransform` entirely and composes
   `local x parent`, the opposite operand order to everything else here.

## Two probable bugs found in passing

- `EveSpaceObjectDecal.GetMidPointAndNormal` and `GetEdges` apply the bone with
  `vec3.multiply(v, v, this._offsetTransform)` - a COMPONENT-WISE multiply of a
  vec3 against a mat4, which multiplies x, y, z by matrix elements 0, 1, 2. That
  is almost certainly meant to be `vec3.transformMat4`.
- Get/Set asymmetry: `EveBanner.SetTransform` and `EveCurveLineSet.SetTransform`
  write the LOCAL fields while `GetTransform` now returns the bone-composed value,
  so `GetTransform(m); SetTransform(m);` is not a round trip on a skinned object -
  it bakes the bone into the authored fields and then applies it again.
  **Documented on `EveBanner.SetTransform`**, naming `GetLocalTransform` as its
  counterpart. `EveCurveLineSet` still needs the same treatment.

## How the decal reaches its bone

No `_bone`. `GetBatches` rebuilds `_offsetTransform` every frame from the parent's
packed joint matrices (`perObjectData.jointMatrices`, falling back to
`parentPerObjectData.vs.Get("JointMat")`), unpacking with
`mat4.fromJointMatIndex(..., this.parentBoneIndex)`. So `_offsetTransform` is only
valid after a frame in which `GetBatches` ran, and `isSkinned` is
`_offsetTransform !== null`. The file carries its own
`// Todo: Update to new bone method so it doesn't have to calculate every frame`.

## Cross-cutting hazards

- **Five different bone-lookup conventions**: index match, positional index, name
  lookup, external assignment, joint-matrix unpack.
- **Two different bone matrices**: `offsetTransform` everywhere except the turret's
  `worldTransform`.
- **Different refresh timing per class**: on rebuild (sprite/plane/spotlight), in
  `UpdateViewDependentData` (banner/curve line/locator set), in `GetBatches`
  (decal). An accessor called outside the frame loop sees a different staleness
  depending on the class (*inferred*).
- `EveObjectSetItem.OnDestroy` nulls `this._bone` on a base class that never
  declares one, so subclasses without a bone silently gain the property.

## `GetSkinned*` stragglers

None in `src/` or `test/`. The only hits are this findings family and the stale
`dist/` bundle, which a rebuild clears.
