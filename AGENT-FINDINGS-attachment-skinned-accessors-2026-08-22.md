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
