import { isFunction, isObject as isObjectLike, isString } from "../utils/type";
import { getMetadata } from "../utils/reflect";
import { tw2 } from "global/tw2";

/**
 * Base property type handler
 */
export default class WglPropertyType
{
    constructor(type)
    {
        this.type = type;
    }

    Is(value)
    {
        return true;
    }

    Equals(a, b)
    {
        return a === b;
    }

    Get(a, key, options)
    {
        return a[key];
    }

    Set(a, key, value, options)
    {
        a[key] = value;
        return true;
    }

    static isModelLike(value)
    {
        return isObjectLike(value) && isFunction(value.SetValues) && isFunction(value.GetValues);
    }

    static isModelInstance(value, ctor)
    {
        return value && value.constructor === ctor;
    }

    /**
     * Gets configured struct type metadata from property metadata.
     * @param {*} target
     * @param {String} property
     * @returns {{constructors: Function[], typeNames: string[]}}
     */
    static getStructTypes(target, property)
    {
        const types = getMetadata("typesOf", target, property) || [];
        const constructors = [];
        const typeNames = [];

        for (let i = 0; i < types.length; i++)
        {
            const value = types[i];
            if (!value) continue;

            if (isFunction(value))
            {
                constructors.push(value);
                const ctorType = getMetadata("type", value);
                if (isString(ctorType))
                {
                    typeNames.push(ctorType);
                }
                continue;
            }

            if (isString(value) && tw2.HasClass(value))
            {
                constructors.push(tw2.GetClass(value));
                typeNames.push(value);
                continue;
            }

            if (isString(value))
            {
                typeNames.push(value);
            }
        }

        return { constructors, typeNames };
    }

    /**
     * Checks whether a struct property owns its assigned object.
     * @param {*} target
     * @param {String} property
     * @returns {Boolean}
     */
    static isOwnedStruct(target, property)
    {
        return getMetadata("isOwned", target, property) !== false;
    }

    /**
     * Destroys a struct value when its property owns it.
     * @param {*} value
     * @param {Object} opt
     * @param {*} target
     * @param {String} property
     */
    static destroyStruct(value, opt, target, property)
    {
        if (!value || !value.Destroy || !this.isOwnedStruct(target, property))
        {
            return;
        }

        value.Destroy({ skipEvents: true, ...opt });
    }

    /**
     * Checks whether a value is permitted for a struct/list based on metadata.
     * @param {*} value
     * @param {{constructors: Function[], typeNames: string[]}} spec
     * @returns {Boolean}
     */
    static isAllowedStructValue(value, spec)
    {
        const { constructors, typeNames } = spec;
        if (!constructors.length && !typeNames.length)
        {
            return true;
        }

        if (!this.isModelLike(value) && !(value && isString(value.__type)))
        {
            return false;
        }

        if (this.isModelLike(value))
        {
            const type = getMetadata("type", value.constructor);
            if (typeNames.includes(type))
            {
                return true;
            }

            for (let i = 0; i < constructors.length; i++)
            {
                if (value.constructor === constructors[i])
                {
                    return true;
                }
            }
        }

        const valueType = value ? value.__type : null;
        if (typeNames.includes(valueType))
        {
            return true;
        }

        for (let i = 0; i < constructors.length; i++)
        {
            if (getMetadata("type", constructors[i]) === valueType)
            {
                return true;
            }
        }

        return false;
    }

    /**
     * Resolves a constructor using a struct value and known type hints.
     * @param {*} value
     * @param {{constructors: Function[], typeNames: string[]}} spec
     * @returns {Function|undefined}
     */
    static getStructConstructor(value, spec)
    {
        const { constructors, typeNames } = spec;

        if (value && value.__ref)
        {
            return constructors[0];
        }

        if (value && isString(value.__type))
        {
            const type = value.__type;

            if (tw2.HasClass(type))
            {
                return tw2.GetClass(type);
            }

            for (let i = 0; i < constructors.length; i++)
            {
                if (getMetadata("type", constructors[i]) === type)
                {
                    return constructors[i];
                }
            }

            const namedIndex = typeNames.indexOf(type);
            if (namedIndex !== -1)
            {
                return constructors[namedIndex] || constructors[0];
            }
        }

        if (typeNames.length === 0 && constructors.length === 1)
        {
            return constructors[0];
        }

        return constructors[0];
    }

    /**
     * Creates a struct item from serialized values.
     * @param {Function} constructor
     * @param {*} value
     * @param {Object} opt
     * @returns {*}
     */
    static fromStructValue(constructor, value, opt = {})
    {
        if (!constructor)
        {
            throw new ReferenceError("No constructor for struct value");
        }

        if (isFunction(constructor.from))
        {
            return constructor.from(value, { skipUpdate: true, ...opt });
        }

        const item = new constructor();
        if (this.isModelLike(item) && item.SetValues)
        {
            item.SetValues(value, { ...opt, skipUpdate: true });
        }
        else if (isObjectLike(value))
        {
            Object.assign(item, value);
        }

        return item;
    }

    /**
     * Destroys struct items in a list from a start index.
     * @param {Array} array
     * @param {Number} start
     * @param {Object} opt
     */
    static destroyItems(array, start, opt, target, property)
    {
        if (target && property && !this.isOwnedStruct(target, property))
        {
            return;
        }

        for (let i = start; i < array.length; i++)
        {
            const item = array[i];
            if (item && item.Destroy)
            {
                item.Destroy({ skipEvents: true, ...opt });
            }
        }
    }
}
