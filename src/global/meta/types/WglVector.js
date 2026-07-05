import { isVector, isVectorEqual } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";

const getArray = (a, key) => a[key] ? Array.from(a[key]) : [];

export class WglVector extends WglPropertyType
{
    constructor(type, Constructor, length)
    {
        super(type);
        this.Constructor = Constructor;
        this.length = length;
    }

    Is(value)
    {
        return this.length ? isVector(value, this.length) : isVector(value);
    }

    Equals(a, b)
    {
        return isVectorEqual(a, b);
    }

    Get(a, key)
    {
        return getArray(a, key);
    }

    Set(a, key, value)
    {
        if (!a[key] || a[key].constructor !== this.Constructor || a[key].length !== value.length)
        {
            a[key] = new this.Constructor(value);
        }
        else
        {
            a[key].set(value);
        }
        return true;
    }
}
