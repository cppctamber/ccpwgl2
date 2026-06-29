import * as readers from "core/reader/Tw2BlackPropertyReaders";
import { isFunction, isPlain, isString, isArray } from "../../utils/type";
import { defineMetadata, getMetadata, getOwnMetadata, hasMetadata, hasOwnMetadata } from "../../utils/reflect";
import { createDecorator } from "../../utils/decorator";

import {
    PT_ARRAY,
    PT_BOOLEAN,
    PT_BYTE,
    PT_COLOR,
    PT_ENUM,
    PT_EXPRESSION,
    PT_FLOAT,
    PT_INT32,
    PT_INT64,
    PT_MATRIX3,
    PT_MATRIX4,
    PT_PATH,
    PT_PLAIN,
    PT_QUATERNION,
    PT_STRING,
    PT_STRUCT,
    PT_STRUCT_LIST,
    PT_STRUCT_RAW,
    PT_UINT,
    PT_UNKNOWN,
    PT_USHORT,
    PT_VECTOR,
    PT_VECTOR2,
    PT_VECTOR3,
    PT_VECTOR4,
    PT_FLOAT32_ARRAY,
    PT_FLOAT64_ARRAY,
    PT_INT8_ARRAY,
    PT_INT16_ARRAY,
    PT_INT32_ARRAY,
    PT_UINT8_ARRAY,
    PT_UINT8_CLAMPED_ARRAY,
    PT_UINT16_ARRAY,
    PT_UINT32_ARRAY,
    PT_ROTATION,
    PT_TRANSLATION,
    PT_SCALING,
    getPropertyTypeName
} from "constant";

const DEFINITION_NAMESPACES = Object.freeze([ "ccp", "wgl", "tny" ]);


/**
 * Checks if a namespace can be used in class definitions
 * @param {String} namespace
 * @returns {Boolean}
 */
function isDefinitionNamespace(namespace)
{
    return DEFINITION_NAMESPACES.includes(namespace);
}


/**
 * Gets a constructor name for error messages
 * @param {Function} target
 * @returns {String}
 */
function getTargetName(target)
{
    return target && target.name ? target.name : "<anonymous>";
}


/**
 * Adds a property to a constructor metadata list
 * @param {*} target
 * @param {String} name
 * @param {String} property
 */
function addConstructorProperty(target, name, property)
{
    let properties = getMetadata(name, target.constructor);
    properties = properties ? Array.from(properties) : [];
    if (!properties.includes(property))
    {
        properties.push(property);
        properties.sort();
        defineMetadata(name, properties, target.constructor);
    }
}


/**
 * Checks if two definition maps match exactly
 * @param {Object} a
 * @param {Object} b
 * @returns {Boolean}
 */
function isSameDefinitionMap(a, b)
{
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    for (let i = 0; i < aKeys.length; i++)
    {
        const key = aKeys[i];
        if (!b[key] || a[key].name !== b[key].name) return false;
    }

    return true;
}


/**
 * Normalizes class definition options
 * @param {Object|String} definitions
 * @param {String} [exclusiveNamespace]
 * @returns {{exclusive: Boolean, namespaces: Object}}
 */
function normalizeDefinitions(definitions, exclusiveNamespace)
{
    const namespaces = {};

    if (exclusiveNamespace)
    {
        if (!isDefinitionNamespace(exclusiveNamespace))
        {
            throw new ReferenceError("Unknown metadata namespace: " + exclusiveNamespace);
        }

        if (!isString(definitions) || !definitions)
        {
            throw new TypeError("Class definition name must be a non-empty string");
        }

        namespaces[exclusiveNamespace] = { name: definitions };
        return { exclusive: true, namespaces };
    }

    if (!isPlain(definitions))
    {
        throw new TypeError("Class definitions must be a plain object");
    }

    const keys = Object.keys(definitions);
    if (!keys.length)
    {
        throw new TypeError("Class definitions cannot be empty");
    }

    let primaryName = null;
    let primaryCount = 0;

    for (let i = 0; i < keys.length; i++)
    {
        const namespace = keys[i];
        if (!isDefinitionNamespace(namespace))
        {
            throw new ReferenceError("Unknown metadata namespace: " + namespace);
        }

        const value = definitions[namespace];
        if (value === false || value === null || value === undefined)
        {
            continue;
        }

        if (isString(value))
        {
            if (!value)
            {
                throw new TypeError("Class definition name must be a non-empty string");
            }
            namespaces[namespace] = { name: value };
            primaryName = value;
            primaryCount++;
            continue;
        }

        if (value !== true)
        {
            throw new TypeError("Class definition values must be strings, true, or false");
        }
    }

    for (let i = 0; i < keys.length; i++)
    {
        const namespace = keys[i];
        if (definitions[namespace] !== true) continue;

        if (primaryCount !== 1)
        {
            throw new ReferenceError("Class definition true shorthand requires exactly one string-valued namespace");
        }

        namespaces[namespace] = { name: primaryName };
    }

    if (!Object.keys(namespaces).length)
    {
        throw new TypeError("Class definitions cannot be empty");
    }

    return { exclusive: false, namespaces };
}


/**
 * Defines class definitions
 * @param {Function} target
 * @param {Object|String} definitions
 * @param {String} [exclusiveNamespace]
 */
function defineClassDefinitions(target, definitions, exclusiveNamespace)
{
    const next = normalizeDefinitions(definitions, exclusiveNamespace);
    const existing = getOwnMetadata("definitions", target);

    if (existing)
    {
        const same = existing.exclusive === next.exclusive &&
            isSameDefinitionMap(existing.namespaces, next.namespaces);

        if (same) return;

        throw new ReferenceError("Class definitions are already frozen for " + getTargetName(target));
    }

    defineMetadata("definitions", {
        frozen: true,
        exclusive: next.exclusive,
        namespaces: next.namespaces
    }, target);

    if (!hasOwnMetadata("type", target))
    {
        const firstNamespace = Object.keys(next.namespaces)[0];
        defineMetadata("type", next.namespaces[firstNamespace].name, target);
    }

    if (exclusiveNamespace)
    {
        defineMetadata("_namespace", exclusiveNamespace, target);
    }
}


/**
 * Property type handler
 * @param target
 * @param property
 * @param type
 * @param typesOf
 */
const typeHandler = function({ target, property }, type, ...typesOf)
{
    if (type !== undefined)
    {
        defineMetadata("type", type, target, property);
        defineMetadata("propertyTypeName", getPropertyTypeName(type), target, property);
        addConstructorProperty(target, "properties", property);
    }

    if (typesOf[0])
    {
        defineMetadata("typesOf", typesOf, target, property);
    }

    if (property.charAt(0) === "_")
    {
        defineMetadata("isPrivate", true, target, property);
    }

    // Cache structs and structList properties
    switch (type)
    {
        case PT_STRUCT_RAW:
        case PT_STRUCT:
            addConstructorProperty(target, "structs", property);
            break;

        case PT_STRUCT_LIST:
            addConstructorProperty(target, "structLists", property);
            break;
    }

};

export const type = createDecorator({
    ctor({ target }, type, ccp)
    {
        defineMetadata("type", type, target);
        if (ccp) defineMetadata("ccp", ccp, target);
    },
    parameter(options, type, typesOf)
    {
        typeHandler(options, type, typesOf);
    }
});

export const define = createDecorator({
    ctor({ target }, definitions)
    {
        defineClassDefinitions(target, definitions);
    }
});

/**
 * Creates a property type decorator
 * @param {Number} propertyType
 * @param {Boolean} [hasTypesOf]
 * @returns {Function}
 */
function create(propertyType, hasTypesOf)
{
    return createDecorator({
        noArgs: !hasTypesOf,
        property(options, ...typesOf)
        {
            if (typesOf.length === 1 && isArray(typesOf[0]))
            {
                typesOf = typesOf[0];
            }

            typeHandler(options, propertyType, ...typesOf);
        }
    });
}

export const unknown = create(PT_UNKNOWN);
export const boolean = create(PT_BOOLEAN);
export const string = create(PT_STRING);
export const path = create(PT_PATH);
export const expression = create(PT_EXPRESSION);
export const float = create(PT_FLOAT);
export const int64 = create(PT_INT64);
export const int32 = create(PT_INT32);
export const uint = create(PT_UINT);
export const ushort = create(PT_USHORT);
export const byte = create(PT_BYTE);

export const float32 = float;
export const uint32 = uint;
export const uint16 = ushort;
export const uint8 = byte;

export const array = create(PT_ARRAY);
export const vector2 = create(PT_VECTOR2);
export const vector3 = create(PT_VECTOR3);
export const vector4 = create(PT_VECTOR4);
export const color = create(PT_COLOR);
export const quaternion = create(PT_QUATERNION);
export const matrix3 = create(PT_MATRIX3);
export const matrix4 = create(PT_MATRIX4);

export const rotation = create(PT_ROTATION);
export const translation = create(PT_TRANSLATION);
export const scaling = create(PT_SCALING);

export const int8Array = create(PT_INT8_ARRAY);
export const int16Array = create(PT_INT16_ARRAY);
export const int32Array = create(PT_INT32_ARRAY);
export const uint8Array = create(PT_UINT8_ARRAY);
export const uint8ClampedArray = create(PT_UINT8_CLAMPED_ARRAY);
export const uint16Array = create(PT_UINT16_ARRAY);
export const uint32Array = create(PT_UINT32_ARRAY);
export const float32Array = create(PT_FLOAT32_ARRAY);
export const float64Array = create(PT_FLOAT64_ARRAY);

/**
 * Dynamic typed array
 * @type {PropertyDecorator}
 */
export const vector = create(PT_VECTOR);

/**
 * Enumerable property type
 * @type {function}
 */
export const enums = createDecorator({
    property({ target, property }, values)
    {
        typeHandler({ target, property }, PT_ENUM);
        defineMetadata("isPrivate", true, target, property);
        defineMetadata("enumerable", values, target, property);
    }
});

/**
 * Plain property type
 * @type {Function}
 */
export const plain = create(PT_PLAIN);

/**
 * Struct list property type
 * @type {Function}
 */
export const list = createDecorator({
    property({ target, property }, ...typesOf)
    {
        if (typesOf.length === 1 && isArray(typesOf[0]))
        {
            typesOf = typesOf[0];
        }

        // Allow defining black struct list from type decorator
        if (isFunction(typesOf[0]))
        {
            const struct = typesOf.shift();

            defineMetadata("black", readers.structList(struct), target, property);
            defineMetadata("blackReaderType", "structList", target, property);

            // Try to guess type from struct
            if (hasMetadata("type", struct))
            {
                typesOf.unshift(getMetadata("type", struct));
            }
        }

        typeHandler({ target, property }, PT_STRUCT_LIST, ...typesOf);
    }
});

/**
 * Black reader helper that reindexes a list into a plain object
 * @type {Function}
 */
export const fromList = createDecorator({

    property({ target, property }, options, ...typesOf)
    {
        if (isString(options))
        {
            options = { key: options };
        }

        if (!isPlain(options))
        {
            throw new Error("Invalid argument for decorator: expected plain object");
        }

        defineMetadata("black", readers.fromList(options), target, property);
        defineMetadata("blackReaderType", "fromList", target, property);

        // Try to guess type from struct
        if (options.struct && hasMetadata("type", options.struct))
        {
            typesOf.unshift(getMetadata("type", options.struct));
        }

        typeHandler({ target, property }, PT_PLAIN, ...typesOf);
    }

});

/**
 * Creates a class type decorator with namespace metadata
 * @param {String} namespace
 * @param {String} name
 * @param {...*} opts
 * @returns {Function}
 */
export function createTypeDecorator(namespace, name, ...opts)
{
    const decorator = type(name, ...opts);
    return function(...args)
    {
        const rv = decorator(...args);
        if (args[0] && isFunction(args[0]))
        {
            defineMetadata("_namespace", namespace, args[0]);
        }
        return rv;
    };
}


/**
 * Creates a class definition decorator with namespace metadata
 * @param {String} namespace
 * @param {String} name
 * @returns {Function}
 */
export function createDefinitionDecorator(namespace, name)
{
    return function(target, property)
    {
        if (property)
        {
            throw new TypeError("Decorator doesn't support properties");
        }

        defineClassDefinitions(target, name, namespace);

        if (target && isFunction(target))
        {
            defineMetadata("_namespace", namespace, target);
        }
    };
}


function createObjectType(propertyType)
{
    return createDecorator({
        property({ target, property }, ...typesOf)
        {
            if (typesOf.length === 1 && isArray(typesOf[0]))
            {
                typesOf = typesOf[0];
            }

            // Allow defining black struct
            if (isFunction(typesOf[0]))
            {
                const struct = typesOf.shift();

                defineMetadata("black", readers.struct(struct), target, property);
                defineMetadata("blackReaderType", "struct", target, property);

                // Try to guess type from struct
                if (hasMetadata("type", struct))
                {
                    typesOf.unshift(getMetadata("type", struct));
                }
            }

            typeHandler({ target, property }, propertyType, ...typesOf);
        }
    });
}

/**
 * Structure property type
 * @type {Function}
 */
export const struct = createObjectType(PT_STRUCT);

/**
 * Raw structure property type
 * @type {Function}
 */
export const rawObject = createObjectType(PT_STRUCT_RAW);

