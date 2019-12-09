import { isFunction, isPlain, isString, toArray } from "global/util";
import { ErrInvalidDecoratorUsage } from "core/Tw2Error";
import { has, get, set } from "../meta";
import { Type } from "../engine/Tw2Constant";

const invalidUsage = {
    class: () => { throw new ErrInvalidDecoratorUsage({ reason: "class" });},
    method: () => { throw new ErrInvalidDecoratorUsage({ reason: "method" });},
    property: () => { throw new ErrInvalidDecoratorUsage({ reason: "property" });},
};

/**
 * Ensures descriptors always have default values
 * - Babel doesn't always handle correctly
 * @param {*} d
 * @returns {*}
 */
export function handleDescriptor(d)
{
    if (d && !d.set && !d.get)
    {
        if (d.writable === undefined) d.writable = true;
        if (d.enumerable === undefined) d.enumerable = true;
        if (d.configurable === undefined) d.configurable = true;
    }
    return d;
}

/**
 *
 * @param {*} target
 * @param {String} [property]
 * @returns {string}
 */
function getTargetType(target, property)
{
    return !property ? "class" : isFunction(target[property]) ? "method" : "property";
}

/**
 * Normalizes decorator handlers
 * @param options
 * @returns {{method: *, property: *, class: *}}
 */
function normalizeHandlers(options)
{
    if (isFunction(options)) options = { handler: options };
    if (!isPlain(options)) throw new ReferenceError("Invalid options object");

    function createHandler(type, options)
    {
        if (isFunction(options[type])) return options[type];
        if (options[type] === false) return invalidUsage[type];
        return isFunction(options.handler) ? options.handler : invalidUsage[type];
    }

    return {
        class: createHandler("class", options),
        method: createHandler("method", options),
        property: createHandler("property", options)
    };
}

/**
 * Creates a decorator
 * @param {Object|Function} options
 * @param {Function} [options.class]
 * @param {Function} [options.property]
 * @param {Function} [options.method]
 * @param {*} [value] - An optional predefined value to pass
 * @returns {*}
 */
export function decorate(options, value)
{
    const handlers = normalizeHandlers(options);

    return function(...args)
    {
        return function(target, property, descriptor)
        {
            if (descriptor) handleDescriptor(descriptor);
            const targetType = getTargetType(target, property);

            const decoratorObject = { target, property, descriptor };
            if (targetType !== "class") decoratorObject.Constructor = target.constructor;

            // Predefined value
            if (value !== undefined)
            {
                return handlers[targetType](decoratorObject, value, ...args);
            }

            return handlers[targetType](decoratorObject, ...args);
        };
    };
}

/**
 * Handles property type meta data
 * @param {*} target
 * @param {String} property
 * @param {PropertyDescriptor }descriptor
 * @param {String|Number} type
 * @param {Array|String} typeOf
 * @param {Array} [childTypes]
 */
export function typeHandler({ target, property, descriptor }, type, typeOf)
{
    // Convert type strings to enum values
    if (isString(type)) type = Type[type.toUpperCase()];
    if (type === undefined) type = Type.UNKNOWN;

    set("type", type, target, property);

    if (typeOf) set("typeOf", toArray(typeOf), target, property);
    if (property.charAt(0) === "_") set("isPrivate", true, target, property);
    if (descriptor.value === null) set("isNullable", true, target, property);

    /*
    // Keep track of a classes's props
    const { constructor } = target;
    const props = has("props", constructor) ? get("props", constructor) : [];
    if (!props.includes(property)) props.push(property);
    props.sort();
    set("props", props, constructor);
    */

    return type;
}
