import { getMetadata, isArray, isPlain } from "global/util";
import { ErrFeatureNotImplemented } from "core/class";


export function isValue(srcValue, destValue)
{
    if (!isArray(srcValue))
    {
        return false;
    }

    /*
    const typesOf = getMetadata("typesOf", destValue.constructor);
    if (typesOf)
    {
        for (let i = 0; i < srcValue.length; i++)
        {
            if (!isPlain(srcValue[i]) || srcValue[i] !== null)
            {
                return false;
            }

            if (srcValue[i] && srcValue[i]._type && typesOf.includes(srcValue[i]._type))
            {
                return true;
            }

            // TODO: Handle abstract classes...
        }
    }
    */

    return true;
}

export function equals(srcValue, destValue, options)
{
    return false;
}

export function get(a, key, options)
{
    const out = [];
    for (let i = 0; i < a[key].length; i++)
    {
        if (options.ids.has(a[key][i]))
        {
            const id = options.ids.get(a[key][i]);
            out.push({ _ref: id });
        }
        else
        {
            options.ids.set(a[key][i], a[key][i]._id);
            const value = a[key][i].GetValues({}, options);
            out.push(value);
        }
    }
    return out;
}

export function set(a, key, value, options)
{
    throw new ErrFeatureNotImplemented({ feature: "STRUCT_LIST.set" });
}
