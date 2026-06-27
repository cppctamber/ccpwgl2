import { meta } from "utils";
import { vec3 } from "math";
import { EvePlanet } from "eve/object";
import { TnySpaceObject } from "./TnySpaceObject";


@meta.tny.type("TnyPlanet")
export class TnyPlanet extends TnySpaceObject
{

    get isPlanet()
    {
        return true;
    }

    SetWrapped(wrapped)
    {
        if (wrapped && !(wrapped instanceof EvePlanet))
        {
            throw new TypeError("Invalid wrapped planet");
        }

        return super.SetWrapped(wrapped);
    }

    GetLongAxis()
    {
        const worldScale = this.GetWorldScaling(TnySpaceObject.global.vec3_1);
        return Math.max(worldScale[0], worldScale[1], worldScale[2]);
    }

    GetSize(out = vec3.create())
    {
        return this.GetScale(out);
    }

}
