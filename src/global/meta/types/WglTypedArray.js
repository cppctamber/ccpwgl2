import { isArray, isNumber, isTyped } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";


export class WglTypedArray extends WglPropertyType
{
    constructor(type, Constructor)
    {
        super(type);
        this.Constructor = Constructor;
    }

    Is(value)
    {
        if (isTyped(value))
        {
            return true;
        }

        if (!isArray(value))
        {
            return false;
        }

        for (let i = 0; i < value.length; i++)
        {
            if (!isNumber(value[i]))
            {
                return false;
            }
        }

        return true;
    }

    Equals(a, b)
    {
        if (!a || !b || b.constructor !== this.Constructor || a.length !== b.length)
        {
            return false;
        }

        if (a === b)
        {
            return true;
        }

        if (a.constructor !== this.Constructor)
        {
            a = new this.Constructor(a);
        }

        for (let i = 0; i < a.length; i++)
        {
            if (!Object.is(a[i], b[i]))
            {
                return false;
            }
        }

        return true;
    }

    Get(a, key)
    {
        return a[key] ? Array.from(a[key]) : [];
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
