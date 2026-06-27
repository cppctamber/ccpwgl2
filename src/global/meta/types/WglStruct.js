import WglPropertyType from "../WglPropertyType";
import { isNoU } from "../../utils/type";

export default class WglStruct extends WglPropertyType
{
    Is(value)
    {
        return isNoU(value) || typeof value === "object";
    }

    Delete(a, key, opt)
    {
        return this.Set(a, key, null, opt);
    }

    Get(a, key, options)
    {
        return a[key] === null ? null : a[key].GetValues({}, options);
    }

    Set(a, key, value, opt)
    {
        if (opt && opt.skipObjects)
        {
            return false;
        }

        const current = a[key];
        const spec = this.constructor.getStructTypes(a, key);

        if (value === null)
        {
            if (!current) return false;
            if (current.Destroy)
            {
                current.Destroy({ skipEvents: true, ...opt });
            }
            a[key] = null;
            return true;
        }

        if (this.constructor.isModelLike(value))
        {
            if (!this.constructor.isAllowedStructValue(value, spec))
            {
                throw new TypeError(`Unexpected struct type for ${key}`);
            }

            if (current === value)
            {
                return false;
            }

            if (current && current.Destroy)
            {
                current.Destroy({ skipEvents: true, ...opt });
            }

            a[key] = value;
            return true;
        }

        const constructor = this.constructor.getStructConstructor(value, spec);
        if (!this.constructor.isAllowedStructValue(value, spec))
        {
            throw new TypeError(`Unexpected struct value for ${key}`);
        }

        if (!constructor)
        {
            throw new ReferenceError(`Unknown struct constructor for ${key}`);
        }

        if (current && this.constructor.isModelInstance(current, constructor) && current.SetValues)
        {
            return current.SetValues(value, { ...opt, skipUpdate: true });
        }

        if (current && current.Destroy)
        {
            current.Destroy({ skipEvents: true, ...opt });
        }

        a[key] = this.constructor.fromStructValue(constructor, value, opt);
        return true;
    }
}
