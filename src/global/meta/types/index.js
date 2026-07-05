import { isFunction, isPlain } from "../../utils/type";

// Explicit (not wildcard) re-exports: `export * from` did not reliably
// propagate these through this barrel under this project's webpack 4 +
// babel-loader setup (config.js's `import * as MT from "global/meta/types"`
// saw every one of these as missing, even already-named exports). Naming
// each export here sidesteps whatever is causing that.
export { WglArray } from "./WglArray";
export { WglBoolean } from "./WglBoolean";
export { WglExpression } from "./WglExpression";
export { WglFloat32 } from "./WglFloat32";
export { WglInt32 } from "./WglInt32";
export { WglInt64 } from "./WglInt64";
export { WglPath } from "./WglPath";
export { WglPlain } from "./WglPlain";
export { WglString } from "./WglString";
export { WglStruct } from "./WglStruct";
export { WglStructList } from "./WglStructList";
export { WglTypedArray } from "./WglTypedArray";
export { WglUInt8 } from "./WglUInt8";
export { WglUInt16 } from "./WglUInt16";
export { WglUInt32 } from "./WglUInt32";
export { WglUnknown } from "./WglUnknown";
export { WglVector } from "./WglVector";

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
