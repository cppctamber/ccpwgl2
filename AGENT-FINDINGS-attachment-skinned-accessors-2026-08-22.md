# Attachment `GetSkinned*` accessors - review, 2026-08-22

Requested: attachments should provide a `GetSkinned...` family; not all do.
Confirmed - only ONE does. Review only, nothing changed.

## The pattern, as `EveBanner` defines it

`EveBanner` is the sole complete implementation and sets the shape: three spaces
per quantity, each a pure accessor writing into an `out`.

| Space | Method | Transform applied |
| --- | --- | --- |
| local | `GetX(out)` | the item's own `transform` |
| skinned | `GetSkinnedX(out)` | local, then `this._bone.offsetTransform` |
| world | `GetWorldX(out)` | the item's `_worldTransform` |

Applied to four quantities: `Direction`, `BoundingBox`, `BoundingSphere`,
`Transform`. The skinned form degrades to the local one when there is no bone:

```js
GetSkinnedDirection(out)
{
    if (!this._bone) return this.GetDirection(out);
    const m = mat4.multiply(EveBanner.global.mat4_0, this._bone.offsetTransform, this.transform);
    vec3.set(out, m[8], m[9], m[10]);
    return vec3.normalize(out, out);
}
```

That fallback matters: a caller can use the skinned accessor unconditionally and
get the right answer on unskinned hulls, which is what makes the family worth
having rather than each caller testing `_bone` itself.

## Inventory

| Item | local accessors | skinned | world | bone plumbing |
| --- | --- | --- | --- | --- |
| `EveBanner` | BoundingBox, BoundingSphere, Direction, Transform | **all four** | all four | full |
| `EveLocator2` | BoundingBox, BoundingSphere, Direction, Transform, Translation, Scale | **none** | BoundingBox, BoundingSphere, Transform | `_bone` + offsetTransform |
| `EveSpriteSet` | BoundingBox, BoundingSphere, Transform | **none** | WorldPosition only | `_bone` + offsetTransform |
| `EvePlaneSet` | BoundingBox, Transform | **none** | none | `_bone` + offsetTransform |
| `EveSpotlightSet` | BoundingBox, Transform | **none** | none | `_bone` + offsetTransform |
| `EveCurveLineSet` | BoundingBox, Transform | **none** | Transform | `_bone` + offsetTransform |
| `EveLocatorSets` | Transform | **none** | Transform | `_bone` + offsetTransform |
| `EveTurretSet` | BoundingBox, Transform | **none** | none | `_bone` + offsetTransform |
| `EveSpaceObjectDecal` | Transform | **none** | Transform, Direction | **no `_bone`** - uses `offsetTransform` 14 times by another route |

Every class except the decal already resolves a `_bone` and reads
`offsetTransform`, so the missing accessors are a naming and exposure job, not new
machinery. The decal is the exception and needs looking at before being included -
it touches `offsetTransform` more than anything else here but never assigns
`_bone`, so how it reaches its bone should be established first rather than
assumed to match.

## Two things to settle BEFORE implementing

**Nothing calls `GetSkinned*` today.** Repo-wide, the only references are the
definitions inside `EveBanner`. Adding the family to eight more classes would
create a large API surface with no consumer to verify it against, and an accessor
that is never called is an accessor whose transform order is never checked. Worth
naming the intended caller first - the decal camera framing work needs skinned
bounds, and would exercise `GetSkinnedBoundingBox` and `GetSkinnedDirection`
immediately, which would be a good forcing function.

**Carbon has no counterpart under this name.** Grepping
`trinity/trinity/Eve/SpaceObject/Attachments/**` finds no `GetSkinned*`, so this
is a ccpwgl convention rather than a port of one. That is allowed, but it means
the shape is ours to pin deliberately and should be recorded as an extension, per
the org rule on deliberate non-Carbon additions - not left to be inferred from one
class.

## If it proceeds

The mechanical part per class: add `GetSkinnedX` beside each existing `GetX`,
composing `this._bone.offsetTransform` with the local result and falling back to
`GetX` when `_bone` is absent, exactly as `EveBanner` does. Watch the composition
order - `mat4.multiply(out, bone.offsetTransform, transform)` in `EveBanner`, which
is bone-then-local in gl-matrix argument order; see the carbon math conventions
skill before copying it into a class whose local transform is built differently.

Several classes are also missing their `GetWorld*` counterparts (plane, spotlight,
turret have none at all). If the family is meant to be uniform, that gap should be
closed in the same pass rather than leaving two thirds of a pattern.

---

# The real problem is worse than missing methods

Six of the eight classes ALREADY apply the bone inside their "local" accessor:

```js
GetTransform(out)                       // EvePlaneSetItem
{
    mat4.copy(out, this._localTransform);
    if (this._bone) mat4.multiply(out, this._bone.offsetTransform, out);
    return out;
}
```

| Class | bone folded into the local accessor |
| --- | ---: |
| EvePlaneSet, EveSpriteSet, EveSpotlightSet, EveLocator2 | 2 each |
| EveCurveLineSet, EveLocatorSets | 1 each |
| **EveBanner, EveTurretSet** | **0** |

So `GetTransform` names a DIFFERENT SPACE depending on which class you call it on:
skinned on six of them, local on `EveBanner` and `EveTurretSet`. A caller cannot
know which it is getting without reading the class. That is the trouble, and it is
not fixed by adding methods.

**Naive implementation would make it worse.** Adding

```js
GetSkinnedTransform(out) { this.GetTransform(out); return mat4.multiply(out, bone.offsetTransform, out); }
```

to any of the six APPLIES THE BONE TWICE, and the result would look plausible on
an unskinned hull and be silently wrong on a skinned one - the hardest kind of
error to notice.

## Doing it properly

1. Make `GetX` purely local on all eight, i.e. remove the folded bone from the six.
2. Add `GetSkinnedX` composing the bone, with `EveBanner`'s no-bone fallback.
3. **Audit every existing caller.** Those six accessors currently RETURN SKINNED
   RESULTS. Any caller relying on that silently becomes local at step 1, which is
   a behaviour change wherever bones actually move - and it will not show on
   unskinned hulls, so it needs finding by reading, not by looking.

Step 3 is the whole risk. Steps 1 and 2 are mechanical.

## Why it drifted: Carbon passes a bag, ccpwgl caches per item

Carbon does not resolve a bone per attachment. It passes the bone LIST down the
call:

```cpp
virtual bool UpdateVisibility( const EveUpdateContext&, const Matrix& parentTransform,
                               const Float4x3* bones, size_t boneCount ) override;
AxisAlignedBoundingBox GetAabb( const Float4x3* bones, size_t boneCount ) const;
```

obtained once from `Tr2GrannyAnimationUtils::GetBoneList(...)` and threaded
through. The caller therefore decides the space, and there is no per-item cached
bone to disagree about.

ccpwgl instead caches `this._bone = parent.GetBone(this.boneIndex)` on each item.
That is a reasonable adaptation, but with no owning convention each class chose
independently whether its accessor folds the bone in - which is exactly how six
went one way and two the other. If the accessor family is formalised, this is the
decision that has to be recorded with it: the per-item cached bone is a deliberate
ccpwgl extension over Carbon's bag, and the accessor spaces are what make it safe.
