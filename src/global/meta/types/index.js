import { isFunction, isPlain } from "../../utils/type";

/**
 * @typedef {Function|Object} PropertyTypeDefinition
 *
 * @typedef {Object} PropertyTypeDescriptor
 * @property {Function} type - Property type handler constructor.
 * @property {Function} [ctor] - Optional typed array constructor for vector-style handlers.
 * @property {number} [length] - Optional vector length for vector-style handlers.
 */

/**
 * Registers property handlers from descriptor configuration.
 * @param {Tw2PropertyTypeStore} store
 * @param {Object<number, PropertyTypeDefinition>} definitions
 * @returns {Tw2PropertyTypeStore}
 */
export function registerPropertyTypes(store, definitions = {})
{
    for (const key in definitions)
    {
        if (!definitions.hasOwnProperty(key)) continue;

        const type = Number(key);
        const definition = definitions[key];
        const descriptor = normalizePropertyTypeDefinition(type, definition);

        const Handler = descriptor.type;
        const value = descriptor.length !== undefined || descriptor.ctor !== undefined
            ? new Handler(type, descriptor.ctor, descriptor.length)
            : new Handler(type);

        store.Set(type, value);
    }

    return store;
}

/**
 * Normalizes a property type definition.
 * @param {Number} type
 * @param {PropertyTypeDefinition} definition
 * @returns {PropertyTypeDescriptor}
 */
function normalizePropertyTypeDefinition(type, definition)
{
    if (isFunction(definition))
    {
        return { type: definition };
    }

    if (isPlain(definition) && isFunction(definition.type))
    {
        return definition;
    }

    throw new TypeError(`Invalid property type definition for ${type}`);
}
