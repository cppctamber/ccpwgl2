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
    PT_INDEX_BUFFER,
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
    PT_VECTOR4
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
    ctor({ target }, type, ccp=type)
    {
        defineMetadata("type", type, target);
        defineMetadata("ccp", ccp, target);
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

/**
 * Unknown value type
 * @type {PropertyDecorator}
 */
export const unknown = create(PT_UNKNOWN);

/**
 * Boolean property type
 * @type {PropertyDecorator}
 */
export const boolean = create(PT_BOOLEAN);

/**
 * String property type
 * @type {PropertyDecorator}
 */
export const string = create(PT_STRING);

/**
 * Path property type
 * @type {PropertyDecorator}
 */
export const path = create(PT_PATH);

/**
 * Expression property type
 * @type {PropertyDecorator}
 */
export const expression = create(PT_EXPRESSION);

/**
 * Float property type
 * @type {PropertyDecorator}
 */
export const float = create(PT_FLOAT);

/**
 * Uint property type
 * @type {PropertyDecorator}
 */
export const uint = create(PT_UINT);

/**
 * Ushort property type
 * @type {PropertyDecorator}
 */
export const ushort = create(PT_USHORT);

/**
 * Byte property type
 * @type {PropertyDecorator}
 */
export const byte = create(PT_BYTE);

/**
 * Array property type
 * @type {PropertyDecorator}
 */
export const array = create(PT_ARRAY);

/**
 * Vector 2 property type
 * @type {PropertyDecorator}
 */
export const vector2 = create(PT_VECTOR2);

/**
 * Vector 3 property type
 * @type {PropertyDecorator}
 */
export const vector3 = create(PT_VECTOR3);

/**
 * Vector 4 property type
 * @type {PropertyDecorator}
 */
export const vector4 = create(PT_VECTOR4);

/**
 * Linear colour property type
 * @type {PropertyDecorator}
 */
export const color = create(PT_COLOR);

/**
 * Quaternion property type
 * @type {PropertyDecorator}
 */
export const quaternion = create(PT_QUATERNION);

/**
 * Matrix 3 property type
 * @type {PropertyDecorator}
 */
export const matrix3 = create(PT_MATRIX3);

/**
 * Matrix 4 property type
 * @type {PropertyDecorator}
 */
export const matrix4 = create(PT_MATRIX4);

/**
 * Index buffer property type
 * @type {PropertyDecorator}
 */
export const indexBuffer = create(PT_INDEX_BUFFER);

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

