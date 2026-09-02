import { meta } from "utils";
import { EveStation2 } from "eve/object";
import { TnySpaceObject } from "./TnySpaceObject";


/**
 * A stationary hull - sof `buildClass` 2. STATIONARY, not "station".
 *
 * The enum is `BUILDCLASS_STATIONARY` (`EveSOFData.h:1504-1510`) and it means
 * what it says: inert scenery. Measured over the client's 2552 hulls,
 * buildClass 2 is asteroid 325, wreck 167, structure_small 103, celestial 94,
 * station 74, jumpgate 42, container 20, corpse 14. Rocks and wrecks outnumber
 * space stations four to one, so naming this `TnyStation` would describe the
 * minority and mislead about the rest.
 *
 * Carbon's CLASS name `EveStation2` is the outlier here, not the enum. This
 * layer stands in for the game's Python rather than mirroring engine class
 * names, and it already declines to mirror ccpwgl's `EveStation2 extends
 * EveShip2` (`src/eve/object/EveStation2.js:30`), so it does not inherit that
 * naming wart either. The object wrapped is still an `EveStation2`.
 *
 * Carbon's `EveStation2` extends `EveSpaceObject2` DIRECTLY, as a sibling of
 * `EveMobile`, and declares no data at all: zero Blue attributes, overriding
 * only `GetBatches` and `PrepareShaderData` (`EveStation2.h:13-26`). Everything
 * it appears to "own" - spotlights, planes, decals, locator sets - belongs to
 * `EveSpaceObject2`. So this is a marker, deliberately.
 *
 * It extends `TnySpaceObject` and not `TnyMobile` because a stationary hull has
 * no turrets. That is measured, not assumed: of the 948 buildClass 2 hulls,
 * ZERO carry a turret locator - zero carry a `locator_` string of any kind -
 * against 5159 on buildClass 0 as a control. Armed structures, citadels
 * included, are buildClass 1 and resolve to `TnyMobile`.
 */
@meta.define("TnyStationary")
export class TnyStationary extends TnySpaceObject
{

    get isStationary()
    {
        return true;
    }

    SetWrapped(wrapped)
    {
        // Checked against EveStation2 specifically. ccpwgl's EveStation2
        // extends EveShip2, so a ship test would pass for one of these and
        // tell us nothing.
        if (wrapped && !(wrapped instanceof EveStation2))
        {
            throw new TypeError("Invalid wrapped stationary object");
        }

        return super.SetWrapped(wrapped);
    }

}
