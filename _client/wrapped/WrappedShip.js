import { meta } from "utils/index";
import { EveShip2 } from "unsupported/eve";
import { EveShip } from "eve/object";
import { WrappedSpaceObject } from "./WrappedSpaceObject";


@meta.type("Ship")
export class WrappedShip extends WrappedSpaceObject
{

    /**
     * Constructor
     * @param wrapped
     * @param values
     */
    constructor(wrapped, values)
    {
        if (!(wrapped instanceof EveShip2 || wrapped instanceof EveShip))
        {
            throw new TypeError("Invalid wrapped object");
        }

        super(wrapped, values);
    }

}
