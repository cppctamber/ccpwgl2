import { meta } from "utils";
import { EveShip, EveShip2 } from "eve/object";
import { TnyMobile } from "./TnyMobile";


@meta.define("TnyShip")
export class TnyShip extends TnyMobile
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
        const part = this.constructor.getBoosterPart(this.wrapped);
        return part ? part.boosterGain || 0 : 0;
    }

    set boosterStrength(value)
    {
        this.SetBoosterStrength(value);
    }

    @meta.uint
    get boosterLength()
    {
        const scale = this.constructor.getBoosterScale(this.wrapped);
        return scale ? scale.z || scale[2] || 0 : 0;
    }

    set boosterLength(value)
    {
        const scale = this.constructor.getBoosterScale(this.wrapped);
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
        part = this.constructor.getBoosterPart(part || this.wrapped);
        if (!part)
        {
            return false;
        }

        part.boosterGain = value;
        return true;
    }

    HasBoosters(part)
    {
        return !!this.constructor.getBoosterPart(part || this.wrapped);
    }

    static getBoosterPart(part)
    {
        return part && part.boosters ? part : null;
    }

    static getBoosterScale(part)
    {
        part = this.getBoosterPart(part);
        return part &&
            part.boosters &&
            part.boosters.effect &&
            part.boosters.effect.parameters &&
            part.boosters.effect.parameters.BoosterScale;
    }

    static OFFSET_CENTER = true;

}
