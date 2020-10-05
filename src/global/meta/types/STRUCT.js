import { getMetadata, isPlain } from "global/util";
import { ErrFeatureNotImplemented } from "core/class";


export function isValue(srcValue, destValue)
{
    if (srcValue !== null && !isPlain(srcValue))
    {
        return false;
    }

    /*
    if ("_type" in srcValue)
    {
        const typesOf = getMetadata("typesOf", destValue.constructor);
        if (typesOf)
        {
            if (typesOf.includes(srcValue._type))
            {
                return true;
            }

            // TODO: Check abstract classes...
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
    if (!a[key])
    {
        return null;
    }

    if  (options.ids.has(a[key]))
    {
        const id = options.ids.get(a[key]);
        return {  _ref: id };
    }
    else
    {
        options.ids.set(a[key], a[key]._id);
        return a[key].GetValues({}, options);
    }
}

export function set(a, key, value, options)
{
    throw new ErrFeatureNotImplemented({ feature: "STRUCT.set" });
}
