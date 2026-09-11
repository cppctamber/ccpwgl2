import { meta } from "utils";
import { EveSpaceObject2 } from "eve/object/EveSpaceObject2";


/**
 * A station.
 *
 * Carbon's `EveStation2` (`Eve/SpaceObject/EveStation2.h:14`) extends
 * `EveSpaceObject2`, declares **no** fields of its own, and overrides only
 * `GetBatches` and a `PrepareShaderData` that scales the ship shader data's y
 * by activation strength. runtime-trinity's port is correspondingly empty.
 *
 * It extends `EveSpaceObject2` here, as Carbon does. It used to extend
 * `EveShip2`, because ccpwgl had no base at all - `EveShip2` WAS the space
 * object, carrying the update, batching, per-object data and child traversal a
 * station needs - so a station inherited boosters, turret sets and kill
 * counters and treated them as inert. The base now exists and the inheritance
 * says what it means.
 *
 * This class used to redeclare seventeen fields the parent already had, which
 * did nothing except shadow them - and two of those shadows were declared
 * against class names that do not exist in ccpwgl, `EveCurveSet` and
 * `TriPointLight`, on an object type whose content is full of curve sets and
 * point lights. Only the fields the base genuinely lacks are declared below.
 */
@meta.define("EveStation2", true)
export class EveStation2 extends EveSpaceObject2
{

    @meta.list("Tr2PointLight")
    lights = [];

    @meta.list("TriObserverLocal")
    observers = [];

    @meta.struct("Tr2RotationAdapter")
    modelRotationCurve = null;

    @meta.struct("Tr2MeshLod")
    meshLod = null;

}
