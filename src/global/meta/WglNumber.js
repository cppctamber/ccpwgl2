import { num } from "math";
import { isNumber } from "../utils/type";
import WglPropertyType from "./WglPropertyType";

export default class WglNumber extends WglPropertyType
{
    Is(value)
    {
        return isNumber(value) && Number.isFinite(Number(value));
    }

    Equals(a, b)
    {
        return this.Is(b) && num.equals(this.Normalize(a), this.Normalize(b));
    }

    Get(a, key)
    {
        return this.Normalize(a[key]);
    }

    Set(a, key, value)
    {
        a[key] = this.Normalize(value);
        return true;
    }

    Normalize(value)
    {
        return this.Is(value) ? Number(value) : 0;
    }
}
