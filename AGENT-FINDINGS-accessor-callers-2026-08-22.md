# Caller audit: attachment accessors, 2026-08-22

Read-only audit, transcribed. Decision under test: the plain accessor always
returns the bone-aware answer, and callers never have to know whether a thing is
animated.

## The change is safe where it matters

**Bounds accumulation - all need the bone.** `EveShip2.RebuildBounds` unions
`GetBoundingBox`/`GetBoundingSphere` over `attachments`; the legacy
`EveSpaceObject` does the same; and `EveObjectSet.OnRebuildBounds` is the link in
the chain, item box to set box to hull box. If items returned raw local here,
every set-level and hull-level bound silently loses the bone.

**Composing with a parent transform afterwards is NOT a double-application**,
because the folded bone is `offsetTransform`, which is object-local, while the
parent transform is object-to-world. Confirmed at `EveObjectSet` item and set
`GetWorld*`, `EveLocator2` `GetWorld*`, `EveSpriteSet.GetWorldPosition` and
`EveCurveLineSet`.

**`EveBanner.GetWorldBoundingBox`/`GetWorldBoundingSphere` rebuild from
`_worldTransform`** rather than composing `GetBoundingBox`, so the new bone-aware
box cannot double into them. Preserve that shape exactly.

## Do not "fix" the turret

`EveTurretSetItem.UpdateTransforms` bakes `this._bone.worldTransform` into
`rotation`/`position` every frame, so `_localTransform` is already bone-aware and
the accessors returning it unmodified are correct. Adding `offsetTransform` on top
applies the bone TWICE. It is the highest-risk site in this change and the one
most likely to be "corrected" by pattern-matching the other classes.

Open question flagged by the audit: it uses `worldTransform` where every other
class uses `offsetTransform`, so whether the turret's answer is even in the same
space as the rest is unverified.

## Defects the accessor change does NOT reach

These read the raw field directly, so making the accessor correct does not fix
them. Listed in priority order.

1. **`EvePlaneSet` packs `item._localTransform` straight into the vertex buffer**
   and never calls `GetTransform`. Its `GetBoundingBox` IS bone-aware. So a plane
   on a moving bone is BOUNDED where it moves to and DRAWN where it was authored.
2. **`EveSpotlightSet` renders in two different spaces.** The quad path uses
   `item.GetTransform` then composes the parent; the non-quad path (`useQuads`
   false) uses raw `item.transform` with no bone and no parent.
3. **`EveBoosterSet.UpdateItemsFromLocators` copies `locator.transform`**, the raw
   field, so even the locator's own bone is dropped on the way in - and
   `EveBoosterSet` passes `null` bones to its base, so `GetBone()` could not work
   anyway. Its sprite glows DO get the real bones, so the glows follow the bone and
   the boosters they belong to do not. `EveTurretSet` destructures the same tuple
   and DOES keep the bone.
4. **`EveShip2.FindLocatorTransformByName` returns `locator.transform`** raw,
   contradicting `EveLocator2.GetTransform`. Public API with no in-repo callers, so
   external consumers get the local answer.
5. **`EveShip2._GetLocatorSetItemTransform` hand-rolls** the bone compose instead
   of calling `EveLocatorSetItem.GetTransform`, which does exactly that. Correct
   today, but it is the duplication this decision exists to remove. Feeds damage
   locators and missile targeting.

## Get/Set asymmetry

`Set*` means "write the raw authored value" repo-wide, so a bone-aware `Get*`
makes every `Get`/`Set` pair lossy: `GetTransform(m); SetTransform(m);` bakes the
bone into the authored fields and it is then applied again next frame.

- `EveBanner.SetTransform` - DOCUMENTED, names `GetLocalTransform` as its partner.
- `EveCurveLineSet.SetTransform` - same shape, PRE-EXISTING, now documented too.
- Plane, spotlight, sprite, locator-set and turret items have no `SetTransform`
  but expose authored `position`/`rotation`/`scaling` that a property editor
  writes directly, which is the same round trip through a different door.

## The decal disagrees with itself

`GetTransform` folds `_offsetTransform`; `GetWorldTransform` does NOT, and it
composes `local x parent` where every other `GetWorldTransform` in the repo is
`parent x local`. Its only caller is the editor gizmo. Two separate faults, and
which is the intended fix is unverified.

## Pre-existing bugs found in passing, unrelated to this change

- `TnyCameraTest` calls `object.GetBoundingSphere()` with NO `out` argument; every
  accessor in this family writes into `out`.
- Duck-typed probes in `EveSpaceSceneShadowHandler`, `EveTurretTarget`, `TnySlot`
  and `WrappedSlots` fall back to `GetTransform` and use the result AS A WORLD
  transform. The audit found no path by which an attachment item reaches those
  fallbacks, but they are written as if it can.

## Confidence

Confident: bounds need the bone; the parent compose is safe; the turret would
double-apply; the Get/Set asymmetry is real; the booster locator drops the bone;
the decal contradicts itself.

Unverified: whether the turret's `worldTransform` is in the same space as
everyone else's `offsetTransform`; whether an attachment item can actually reach
the duck-typed `GetTransform` fallbacks at runtime.

## Correction: boosters are Carbon-faithful, not a defect (operator)

Boosters CANNOT have bones in Carbon. So item 3 above is not a port bug and must
not be "fixed" as one: `EveBoosterSet` copying the locator's raw transform and
passing `null` bones to its base matches the engine it is a port of.

Making boosters bone-aware in ccpwgl is possible and may be wanted, but it would
be a DELIBERATE EXTENSION beyond Carbon and belongs in the non-Carbon extensions
register with its origin and required consumer, not slipped in as a bug fix.

That also reframes the glow asymmetry: the sprite glows receiving real bones while
the boosters do not is odd-looking but is not evidence of a fault.
