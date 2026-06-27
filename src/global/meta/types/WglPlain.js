import { isObject as isObjectLike, isPlain } from "../../utils/type";
import WglPropertyType from "../WglPropertyType";

export default class WglPlain extends WglPropertyType
{
    Is(value)
    {
        return isPlain(value);
    }

    Get(a, key)
    {
        return Object.assign({}, a[key]);
    }

    Set(a, key, value)
    {
        if (!a[key])
        {
            a[key] = value ? Object.assign({}, value) : value;
            return true;
        }

        if (!isObjectLike(a[key]))
        {
            a[key] = value;
            return true;
        }

        Object.assign(a[key], value);
        return true;
    }
}
