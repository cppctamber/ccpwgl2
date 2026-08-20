import { meta } from "utils";
import { EveShip2 } from "eve/object/EveShip2";


/**
 * A station.
 *
 * Carbon's `EveStation2` (`Eve/SpaceObject/EveStation2.h:14`) extends
 * `EveSpaceObject2`, declares **no** fields of its own, and overrides only
 * `GetBatches` and a `PrepareShaderData` that scales the ship shader data's y
 * by activation strength. runtime-trinity's port is correspondingly empty.
 *
 * **It extends `EveShip2` here on purpose.** ccpwgl has no `EveSpaceObject2`:
 * its chain is `WglTransform > EveObject > EveShip2`, and `EveShip2` is the
 * space object in practice - it carries the update, batching, per-object data
 * and child traversal a station needs. Carving a base out of it would be a
 * structural change with no behavioural gain, which is the kind of thing that
 * should not be imported from Carbon just because Carbon is shaped that way.
 * The cost is that a station also inherits ship-only surface (boosters,
 * turrets, kill counters); that is inert on station data and is the cheaper
 * side of the trade.
 *
 * This class used to redeclare seventeen fields the parent already had, which
 * did nothing except shadow them - and two of those shadows were declared
 * against class names that do not exist in ccpwgl, `EveCurveSet` and
 * `TriPointLight`, on an object type whose content is full of curve sets and
 * point lights. Only the fields `EveShip2` genuinely lacks are declared below.
 */
@meta.type("EveStation2")
@meta.define({
    wgl: "EveStation2",
    ccp: true
})
export class EveStation2 extends EveShip2
{

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.list("Tr2PointLight")
    lights = [];

    @meta.list("TriObserverLocal")
    observers = [];

    @meta.struct("Tr2RotationAdapter")
    modelRotationCurve = null;

    @meta.struct("Tr2MeshLod")
    meshLod = null;

}
