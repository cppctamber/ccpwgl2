import { isObject as isObjectLike, isPlain } from "../../utils/type";
import WglPropertyType from "./WglPropertyType";

export default class WglPlain extends WglPropertyType
{
    is(value)
    {
        return isPlain(value);
    }

    get(a, key)
    {
        return Object.assign({}, a[key]);
    }

    set(a, key, value)
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
