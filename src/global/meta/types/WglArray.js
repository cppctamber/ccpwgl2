import { isArray, isEqual } from "../../utils/type";
import WglPropertyType from "./WglPropertyType";

export default class WglArray extends WglPropertyType
{
    is(value)
    {
        return isArray(value);
    }

    equals(a, b)
    {
        return isEqual(a, b);
    }

    get(a, key)
    {
        return a[key] ? Array.from(a[key]) : [];
    }

    set(a, key, value)
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
