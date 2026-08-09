import { meta } from "utils";
import { TnyMoon } from "./TnyMoon";


/**
 * A planet: a moon with atmospherics. Same wrapped EvePlanet and the same
 * fetch, keeping the aurora child the templates carry.
 */
@meta.tny.type("TnyPlanet")
@meta.tny.define("TnyPlanet")
export class TnyPlanet extends TnyMoon
{

    static celestialKey = "planetID";

    static aurora = true;

    get isMoon()
    {
        return false;
    }

}
