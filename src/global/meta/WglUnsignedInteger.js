import { num } from "math";
import WglNumber from "./WglNumber";

export default class WglUnsignedInteger extends WglNumber
{
    constructor(type, min, max, allowNegativeOne = false)
    {
        super(type);
        this.min = min;
        this.max = max;
        this.allowNegativeOne = allowNegativeOne;
    }

    Equals(a, b)
    {
        if (!this.Is(b))
        {
            return false;
        }

        const current = this.Normalize(b);
        return b === current && this.Normalize(a) === current;
    }

    Normalize(value)
    {
        if (!this.Is(value))
        {
            return this.min;
        }

        value = Math.trunc(Number(value));

        if (this.allowNegativeOne && value < 0)
        {
            return -1;
        }

        return num.clamp(value, this.min, this.max);
    }
}
