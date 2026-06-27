import { isArray, isEqual } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";

export default class WglArray extends WglPropertyType
{
    Is(value)
    {
        return isArray(value);
    }

    Equals(a, b)
    {
        return isEqual(a, b);
    }

    Get(a, key)
    {
        return a[key] ? Array.from(a[key]) : [];
    }

    Set(a, key, value)
    {
        if (!isArray(a[key]))
        {
            a[key] = value;
            return true;
        }

        if (isEqual(a[key], value))
        {
            return false;
        }

        a[key].splice(0, a[key].length, ...value);
        return true;
    }
}
