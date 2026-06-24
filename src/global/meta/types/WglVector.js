import { isVector, isVectorEqual } from "../../utils/type";
import WglPropertyType from "./WglPropertyType";

const getArray = (a, key) => a[key] ? Array.from(a[key]) : [];

export default class WglVector extends WglPropertyType
{
    constructor(type, Constructor, length)
    {
        super(type);
        this.Constructor = Constructor;
        this.length = length;
    }

    is(value)
    {
        return this.length ? isVector(value, this.length) : isVector(value);
    }

    equals(a, b)
    {
        return isVectorEqual(a, b);
    }

    get(a, key)
    {
        return getArray(a, key);
    }

    set(a, key, value)
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
