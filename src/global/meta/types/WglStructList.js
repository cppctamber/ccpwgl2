import { isArray, isEqual, isNoU } from "../../utils/type";
import WglPropertyType from "./WglPropertyType";

export default class WglStructList extends WglPropertyType
{
    is(value)
    {
        return isArray(value);
    }

    delete(a, key, opt)
    {
        return this.set(a, key, null, opt);
    }

    get(a, key, options)
    {
        const list = a[key] || [];
        const len = list.length;
        if (!len) return null;

        const out = [];
        for (let i = 0; i < len; i++)
        {
            try
            {
                out.push(list[i] ? list[i].GetValues({}, options) : null);
            }
            catch (err)
            {
                console.dir(list[i]);
                throw err;
            }
        }
        return out;
    }

    set(a, key, value, opt)
    {
        if (opt && opt.skipObjects)
        {
            return false;
        }

        if (!a[key])
        {
            a[key] = [];
        }

        if (value === null)
        {
            if (!a[key].length)
            {
                return false;
            }

            this.constructor.destroyItems(a[key], 0, opt);
            a[key].splice(0);
            return true;
        }

        const current = a[key];
        const spec = this.constructor.getStructTypes(a, key);
        const { constructors, typeNames } = spec;
        const isTypedStructList = constructors.length > 0 || typeNames.length > 0;
        const out = [];

        for (let i = 0; i < value.length; i++)
        {
            const item = value[i];

            if (isNoU(item))
            {
                out.push(item);
                continue;
            }

            if (this.constructor.isModelLike(item))
            {
                if (!this.constructor.isAllowedStructValue(item, spec))
                {
                    throw new TypeError(`Unexpected struct item type for ${key}`);
                }

                out.push(item);
                continue;
            }

            if (!isTypedStructList)
            {
                out.push(item);
                continue;
            }

            if (!this.constructor.isAllowedStructValue(item, spec))
            {
                throw new TypeError(`Unexpected struct item type for ${key}`);
            }

            const constructor = this.constructor.getStructConstructor(item, spec);
            if (!constructor)
            {
                throw new ReferenceError(`Unknown struct list constructor for ${key}`);
            }

            const currentItem = current[i];
            if (currentItem && this.constructor.isModelInstance(currentItem, constructor) && currentItem.SetValues)
            {
                currentItem.SetValues(item, { ...opt, skipUpdate: true });
                out.push(currentItem);
            }
            else
            {
                if (currentItem && currentItem.Destroy)
                {
                    currentItem.Destroy({ skipEvents: true, ...opt });
                }
                out.push(this.constructor.fromStructValue(constructor, item, opt));
            }
        }

        if (isEqual(current, out))
        {
            return false;
        }

        if (out.length < current.length)
        {
            this.constructor.destroyItems(current, out.length, opt);
        }

        current.splice(0, current.length, ...out);
        return true;
    }
}
