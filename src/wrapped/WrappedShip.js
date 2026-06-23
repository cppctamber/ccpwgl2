import { meta } from "utils/index";
import { EveShip, EveShip2 } from "eve/object";
import { WrappedSpaceObject } from "./WrappedSpaceObject";


@meta.type("Ship")
export class WrappedShip extends WrappedSpaceObject
{

    @meta.uint
    get kills()
    {
        return this.wrapped ? this.wrapped.killCount : 0;
    }

    set kills(value)
    {
        this.wrapped.killCount = value;
    }

    @meta.uint
    get boosterStrength()
    {
        return this.wrapped ? this.wrapped.boosterGain : 0;
    }

    set boosterStrength(value)
    {
        this.wrapped.boosterGain = value;
    }

    @meta.uint
    get boosterLength()
    {
        return this.wrapped ? this.wrapped.boosters.effect.parameters.BoosterScale.z : 0;
    }

    set boosterLength(value)
    {
        this.wrapped.boosters.effect.parameters.BoosterScale.z = value;
    }

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

        // Offset the ship from it's center
        if (this.constructor.OFFSET_CENTER)
        {
            this.Translate(this.GetOffsetFromBoundsCenter([]))
                .UpdateValues();
        }
    }

    static OFFSET_CENTER = true;

}
