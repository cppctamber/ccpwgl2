import * as readers from "core/reader/Tw2BlackPropertyReaders";
import { isFunction, isPlain, isString } from "../utils/type";
import { createDecorator, defineMetadata, getMetadata, hasMetadata } from "../utils/reflect";

import {
    PT_ARRAY,
    PT_BOOLEAN,
    PT_BYTE,
    PT_COLOR,
    PT_ENUM,
    PT_EXPRESSION,
    PT_FLOAT,
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
    PT_LOCAL_TRANSFORM,
    PT_ROTATION_TRANSFORM,
    PT_WORLD_TRANSFORM,
    PT_PARENT_WORLD_TRANSFORM,
    PT_PARENT_LOCAL_TRANSFORM
} from "constant";


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
            let structs = getMetadata("structs", target.constructor);
            structs = structs ? Array.from(structs) : [];
            if (!structs.includes(property))
            {
                structs.push(property);
                structs.sort();
            }
            defineMetadata("structs", structs, target.constructor);
            break;

        case PT_STRUCT_LIST:
            let structLists = getMetadata("structLists", target.constructor);
            structLists = structLists ? Array.from(structLists) : [];
            if (!structLists.includes(property))
            {
                structLists.push(property);
                structLists.sort();
            }
            defineMetadata("structLists", structLists, target.constructor);
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
export const uint = create(PT_UINT);
export const ushort = create(PT_USHORT);
export const byte = create(PT_BYTE);
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
export const localTransform = create(PT_LOCAL_TRANSFORM);
export const rotationTransform = create(PT_ROTATION_TRANSFORM);
export const worldTransform = create(PT_WORLD_TRANSFORM);
export const parentWorldTransform = create(PT_PARENT_WORLD_TRANSFORM);
export const parentLocalTransform = create(PT_PARENT_LOCAL_TRANSFORM);

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
        // Allow defining black struct list from type decorator
        if (isFunction(typesOf[0]))
        {
            const struct = typesOf.shift();

            defineMetadata("black", readers.structList(struct), target, property);

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
 * Plain from struct list property type
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
            // Allow defining black struct
            if (isFunction(typesOf[0]))
            {
                const struct = typesOf.shift();

                defineMetadata("black", readers.struct(struct), target, property);

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
export const raw = createObjectType(PT_STRUCT_RAW);

