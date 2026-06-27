import WglNumber from "../WglNumber";

export default class WglInt64 extends WglNumber
{
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
        return this.Is(value) ? Math.trunc(Number(value)) : 0;
    }
}
