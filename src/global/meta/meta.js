import { isFunction } from "../util/type";
import { ErrInvalidDecoratorUsage } from "core/Tw2Error";

/**
 * Turns a string into a meta data name
 * @param {String} name
 * @returns {string}
 */
function getMetaName(name)
{
    return `tw2:${name}`;
}

/**
 * Meta data decorator
 * @param {String} name         - The meta data type
 * @param {*} [value=true]      - The meta data's value (defaults to true)
 * @returns {PropertyDecorator}
 * @example
 *
 *     @meta.add("black")
 *     @meta.add("type", "Boolean")
 *     @meta.add("desc", "Toggles displaying the object")
 *     display = true;
 *
 */
export function add(name, value=true)
{
    return Reflect.metadata(getMetaName(name), value);
}

/**
 * Defines meta data
 * @param {String} name
 * @param {*} value
 * @param {*} target
 * @param{String} [property]
 */
export function set(name, value, target, property)
{
    Reflect.defineMetadata(getMetaName(name), value, target, property);
}

/**
 * Checks if a target has meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {boolean}
 */
export function has(name, target, property)
{
    return Reflect.hasMetadata(getMetaName(name), target, property);
}

/**
 * Checks if a target has it's own meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {boolean}
 */
export function hasOwn(name, target, property)
{
    return Reflect.hasOwnMetadata(getMetaName(name), target, property);
}

/**
 * Gets a target's meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {any}
 */
export function get(name, target, property)
{
    return Reflect.getMetadata(getMetaName(name), target, property);
}

/**
 * Gets a target's own meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {any}
 */
export function getOwn(name, target, property)
{
    return Reflect.getOwnMetadata(getMetaName(name), target, property);
}

/**
 * Handler for undefined descriptor values
 * - Babel doesn't always add true as defaults
 * @param {PropertyDescriptor} d
 * @returns {PropertyDescriptor} d
 */
function handleDescriptor(d)
{
    if (d.writable === undefined) d.writable = true;
    if (d.enumerable === undefined) d.enumerable = true;
    if (d.configurable === undefined) d.configurable = true;
    return d;
}

/**
 * Descriptor error messages
 * @type {{METHOD: string, CLASS: string, PARAMETER: string}}
 */
const Failmessage = {
    CLASS: "Decorator not applicable to classes",
    METHOD: "Decorator not applicable to methods",
    PARAMETER: "Decorator not applicable to parameters"
};

/**
 * Decorator factory
 * TODO: Make this cleaner
 * @param {Boolean} hasArguments
 * @param {Object} options
 * @param {Boolean} [options.hasArguments]
 * @param {Function} [options.class]
 * @param {Function} [options.method]
 * @param {Function} [options.parameter]
 * @param {Function} [options.handler]
 * @returns {PropertyDecorator|ClassDecorator|MethodDecorator}
 */
export function create(hasArguments, options)
{
    if (hasArguments)
    {
        return function(...args)
        {
            return function(target, property, descriptor)
            {
                let message;

                if (!property)
                {
                    if (options.class)
                    {
                        return options.class({ target }, ...args);
                    }
                    message = Failmessage.CLASS;
                }
                else
                {
                    if (isFunction(target[property]))
                    {
                        if (options.method)
                        {
                            const result = options.method({ target, property, descriptor }, ...args);
                            handleDescriptor(descriptor);
                            return result;
                        }
                        message = Failmessage.METHOD;
                    }
                    else if (options.parameter)
                    {
                        const result = options.parameter({ target, property, descriptor }, ...args);
                        handleDescriptor(descriptor);
                        return result;
                    }
                    else
                    {
                        message = Failmessage.PARAMETER;
                    }
                }

                if (options.handler)
                {
                    return options.handler({ target, property, descriptor }, ...args);
                }

                message += ` (${property ? property : target.name})`;
                throw new ErrInvalidDecoratorUsage({ message });
            };
        };
    }
    else
    {
        return function(target, property, descriptor)
        {
            let message;

            if (!property)
            {
                if (options.class)
                {
                    return options.class({ target });
                }
                message = Failmessage.CLASS;
            }
            else
            {
                if (isFunction(target[property]))
                {
                    if (options.method)
                    {
                        const result = options.method({ target, property, descriptor });
                        handleDescriptor(descriptor);
                        return result;
                    }
                    message = Failmessage.METHOD;
                }
                else if (options.parameter)
                {
                    const result = options.parameter({ target, property, descriptor });
                    handleDescriptor(descriptor);
                    return result;
                }
                else
                {
                    message = Failmessage.PARAMETER;
                }
            }

            if (options.handler)
            {
                return options.handler({ target, property, descriptor });
            }

            message += ` (${property ? property : target.name})`;
            throw new ErrInvalidDecoratorUsage({ message });
        };
    }
}

