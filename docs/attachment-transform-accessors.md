# Attachment transform accessors: which space each one returns

Reference for anyone positioning something against a ship attachment - locators,
banners, plane/sprite/spotlight items, decals, turrets, boosters. Written for the
skindr camera and decal-framing work.

Verified against source on 2026-08-22.

## The rule

**The plain accessor returns where the thing actually IS.** If the object rides an
animated bone, the bone is included. Callers do not check whether something is
animated - that is the accessor's job.

Names carry the meaning:

| Name shape | Space | Bone |
| --- | --- | --- |
| `GetX` | object space (relative to the ship) | **included** |
| `GetWorldX` | world space | **included** |

`GetTransform` deliberately does NOT say "local", so it does not promise the
authored value - there is no accessor that returns it. If you need what was
authored, read the `position`, `rotation` and `scaling` fields directly.

Nothing is cached. The bone is composed when you call the function, and if you do
not call it, nothing is computed.

## The accessors

### Bone-aware (the normal case)

| Class | Accessors |
| --- | --- |
| `EveLocator2` | `GetTransform`, `GetWorldTransform`, `GetTranslation`, `GetDirection`, `GetBoundingBox`, `GetWorldBoundingBox`, `GetBoundingSphere`, `GetWorldBoundingSphere` |
| `EveBanner` | `GetTransform`, `GetWorldTransform`, `GetDirection`, `GetWorldDirection`, `GetBoundingBox`, `GetWorldBoundingBox`, `GetBoundingSphere`, `GetWorldBoundingSphere` |
| `EvePlaneSetItem` | `GetTransform`, `GetBoundingBox` (+ `GetWorld*` from the base) |
| `EveSpriteSetItem` | `GetTransform`, `GetBoundingBox`, `GetBoundingSphere`, `GetWorldPosition` |
| `EveSpotlightSetItem` | `GetTransform`, `GetBoundingBox` (+ `GetWorld*` from the base) |
| `EveTurretSetItem` | `GetTransform`, `GetBoundingBox` - bone-aware by a DIFFERENT route, see below |
| `EveLocatorSetItem` | `GetTransform`, `GetWorldTransform` |
| `EveCurveLineSet` | `GetTransform`, `GetWorldTransform` - the SET holds the bone; its items defer to it |
| `EveObjectSet` / `EveObjectSetItem` | the base `GetWorldTransform`, `GetWorldBoundingBox`, `GetWorldBoundingSphere` compose the parent onto whatever the item returned, so they inherit its bone-awareness |

### Three exceptions

**`EveBoosterSetItem` is never bone-aware.** `GetTransform`, `GetBoundingBox`,
`GetPosition` and `GetDirection` all return the authored value. This matches
Carbon, where boosters cannot have bones at all, so it is correct rather than
broken. It also means a booster's placement is fixed even on an animated hull -
and note its sprite GLOWS are a separate `EveSpriteSet` which IS bone-aware.

**`EveSpaceObjectDecal.GetWorldTransform` does not include the bone**, while its
`GetTransform` does. It also composes `local x parent`, the reverse of every other
`GetWorldTransform` here. Treat its world answer as unreliable; prefer
`GetTransform` and compose the parent yourself. (The decal has no `_bone` - it
rebuilds an `_offsetTransform` each frame inside `GetBatches` from the packed joint
matrices, so its answer is only valid after a frame in which it rendered.)

**`EveShip2.FindLocatorTransformByName` returns the RAW field**, contradicting
`EveLocator2.GetTransform`. If you have the locator object, call its accessor
instead.

## Ship-level helpers

| Method | Space | Notes |
| --- | --- | --- |
| `EveShip2.GetDamageLocatorPosition(out, index, inWorldSpace = true)` | world by default | bone-aware; pass `false` for object space |
| `EveShip2.GetDamageLocatorDirection(out, index, inWorldSpace = true)` | world by default | same |
| `EveShip2.FindLocatorTransformByName(name)` | object space, **no bone** | see above |

## Two traps

**Get/Set is not a round trip on a skinned object.** `SetTransform` writes the
AUTHORED fields, while `GetTransform` returns the bone-composed value. So
`GetTransform(m); SetTransform(m);` bakes the bone into the authored transform and
the bone is then applied again next frame. Affects `EveBanner.SetTransform` and
`EveCurveLineSet.SetTransform`, and by extension any editor writing
`position`/`rotation`/`scaling` directly. Read back the authored fields instead.

**`EveTurretSetItem` is bone-aware by a different route.** `UpdateTransforms` bakes
`_bone.worldTransform` - note `worldTransform`, not `offsetTransform` - into its
`rotation`/`position` every frame, and the accessors return that. So it is correct
to use, but do not compose a bone onto its result, and be aware it may not be in
the same space as the others. Unverified.

## For the render path, not consumers

If you are writing vertex data rather than consuming a transform: several sets
hand `boneIndex` to the SHADER and let the GPU skin them - plane sets in
`TEXCOORD 7`, spotlight cones and glows at offset 20. Those writers must pass the
UNSKINNED transform. Applying the bone on the CPU as well double-applies it. This
does not affect anything using the accessors above.

## Who these are for

The consumers are mostly intersection and UI code - picking, framing, gizmos,
camera placement. They do not want to be concerned with calculations; they want
the correct answer at this moment.

That is why there is no `GetLocal*` family. When something INTERNAL needs the
authored transform it reads or builds it directly from `position`, `rotation` and
`scaling`, which it is already holding. Exposing a parallel set of local accessors
would put the burden of choosing a space back on every caller, which is the thing
this design removes.
