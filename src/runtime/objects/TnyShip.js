import { meta } from "utils";
import { EveShip, EveShip2 } from "eve/object";
import { TnySpaceObject } from "./TnySpaceObject";


@meta.tny.type("TnyShip")
export class TnyShip extends TnySpaceObject
{

    @meta.uint
    get kills()
    {
        return this.wrapped ? this.wrapped.killCount || 0 : 0;
    }

    set kills(value)
    {
        if (this.wrapped)
        {
            this.wrapped.killCount = value;
        }
    }

    @meta.uint
    get boosterStrength()
    {
        const part = this.constructor.GetBoosterPart(this.wrapped);
        return part ? part.boosterGain || 0 : 0;
    }

    set boosterStrength(value)
    {
        this.SetBoosterStrength(value);
    }

    @meta.uint
    get boosterLength()
    {
        const scale = this.constructor.GetBoosterScale(this.wrapped);
        return scale ? scale.z || scale[2] || 0 : 0;
    }

    set boosterLength(value)
    {
        const scale = this.constructor.GetBoosterScale(this.wrapped);
        if (scale)
        {
            if ("z" in scale) scale.z = value;
            else scale[2] = value;
        }
    }

    SetWrapped(wrapped)
    {
        if (wrapped && !(wrapped instanceof EveShip2 || wrapped instanceof EveShip))
        {
            throw new TypeError("Invalid wrapped ship");
        }

        super.SetWrapped(wrapped);

        if (wrapped && this.constructor.OFFSET_CENTER)
        {
            this.CenterFromBounds();
        }

        return this;
    }

    SetBoosterStrength(value, part)
    {
        part = this.constructor.GetBoosterPart(part || this.wrapped);
        if (!part)
        {
            return false;
        }

        part.boosterGain = value;
        return true;
    }

    HasBoosters(part)
    {
        return !!this.constructor.GetBoosterPart(part || this.wrapped);
    }

    static GetBoosterPart(part)
    {
        return part && part.boosters ? part : null;
    }

    static GetBoosterScale(part)
    {
        part = this.GetBoosterPart(part);
        return part &&
            part.boosters &&
            part.boosters.effect &&
            part.boosters.effect.parameters &&
            part.boosters.effect.parameters.BoosterScale;
    }

    static OFFSET_CENTER = true;

}
