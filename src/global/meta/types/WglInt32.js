import WglNumber from "../WglNumber";
import { num } from "math";

const
    MIN_VALUE = -2147483648,
    MAX_VALUE = 2147483647;

export default class WglInt32 extends WglNumber
{
    Normalize(value)
    {
        if (!this.Is(value))
        {
            return 0;
        }

        return num.clamp(Math.trunc(Number(value)), MIN_VALUE, MAX_VALUE);
    }
}
