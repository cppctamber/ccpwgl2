import * as readers from "core/reader/Tw2BlackPropertyReaders";
import { isFunction, isPlain, isString, isArray } from "../../utils/type";
import { defineMetadata, getMetadata, hasMetadata } from "../../utils/reflect";
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

/**
 * Declares a class and, optionally, the name CCP knows it by.
 *
 *     @meta.define("Tw2Mesh", "Tr2Mesh")   // different name in the black data
 *     @meta.define("EveBanner", true)      // same name on both sides
 *     @meta.define("Tw2GodRaysRenderer")   // ccpwgl only, no black counterpart
 *
 * This replaced `@meta.type`, which carried exactly this signature, and the
 * namespaced `@meta.ccp/wgl/tny.define` form. The namespaces distinguished
 * nothing a consumer ever read: `_namespace` was never consulted, `exclusive`
 * only fed a re-definition equality check, and the sole reader of the
 * definition names was `Model.getClassCCPName` - which is served here by the
 * `ccp` metadata directly.
 *
 * @type {Function}
 */
export const define = createDecorator({
    ctor({ target }, name, ccp)
    {
        // The old object form is a silent no-op under this signature - every
        // name would land as `[object Object]` - so reject it loudly.
        if (isPlain(name))
        {
            throw new TypeError("meta.define takes a name, not a namespace object: define(name, ccpName|true)");
        }

        if (!isString(name) || !name)
        {
            throw new TypeError("Class definition name must be a non-empty string");
        }

        defineMetadata("type", name, target);

        // `true` is the shorthand for "CCP calls it the same thing".
        if (ccp) defineMetadata("ccp", ccp === true ? name : ccp, target);
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

