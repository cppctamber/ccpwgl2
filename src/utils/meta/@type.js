import { Type } from "./types/ModelConstants";
import * as readers from "core/reader/Tw2BlackPropertyReaders";
import {
    isFunction,
    isPlain,
    isString,
    createDecorator,
    defineMetadata,
    getMetadata,
    hasMetadata
} from "utils";


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
        case Type.STRUCT_RAW:
        case Type.STRUCT:
            let structs = getMetadata("structs", target.constructor);
            structs = structs ? Array.from(structs) : [];
            if (!structs.includes(property))
            {
                structs.push(property);
                structs.sort();
            }
            defineMetadata("structs", structs, target.constructor);
            break;

        case Type.STRUCT_LIST:
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
export const unknown = create(Type.UNKNOWN);

/**
 * Boolean property type
 * @type {PropertyDecorator}
 */
export const boolean = create(Type.BOOLEAN);

/**
 * String property type
 * @type {PropertyDecorator}
 */
export const string = create(Type.STRING);

/**
 * Path property type
 * @type {PropertyDecorator}
 */
export const path = create(Type.PATH);

/**
 * Expression property type
 * @type {PropertyDecorator}
 */
export const expression = create(Type.EXPRESSION);

/**
 * Float property type
 * @type {PropertyDecorator}
 */
export const float = create(Type.FLOAT);

/**
 * Uint property type
 * @type {PropertyDecorator}
 */
export const uint = create(Type.UINT);

/**
 * Ushort property type
 * @type {PropertyDecorator}
 */
export const ushort = create(Type.USHORT);

/**
 * Byte property type
 * @type {PropertyDecorator}
 */
export const byte = create(Type.BYTE);

/**
 * Array property type
 * @type {PropertyDecorator}
 */
export const array = create(Type.ARRAY);

/**
 * Vector 2 property type
 * @type {PropertyDecorator}
 */
export const vector2 = create(Type.VECTOR2);

/**
 * Vector 3 property type
 * @type {PropertyDecorator}
 */
export const vector3 = create(Type.VECTOR3);

/**
 * Vector 4 property type
 * @type {PropertyDecorator}
 */
export const vector4 = create(Type.VECTOR4);

/**
 * Linear colour property type
 * @type {PropertyDecorator}
 */
export const color = create(Type.COLOR);

/**
 * Quaternion property type
 * @type {PropertyDecorator}
 */
export const quaternion = create(Type.QUATERNION);

/**
 * Matrix 3 property type
 * @type {PropertyDecorator}
 */
export const matrix3 = create(Type.MATRIX3);

/**
 * Matrix 4 property type
 * @type {PropertyDecorator}
 */
export const matrix4 = create(Type.MATRIX4);

/**
 * Index buffer property type
 * @type {PropertyDecorator}
 */
export const indexBuffer = create(Type.INDEX_BUFFER);

/**
 * Dynamic typed array
 * @type {PropertyDecorator}
 */
export const vector = create(Type.VECTOR);

/**
 * Enumerable property type
 * @type {function}
 */
export const enums = createDecorator({
    property({ target, property }, values)
    {
        typeHandler({ target, property }, Type.ENUM);
        defineMetadata("isPrivate", true, target, property);
        defineMetadata("enumerable", values, target, property);
    }
});

/**
 * Plain property type
 * @type {Function}
 */
export const plain = create(Type.PLAIN);

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

        typeHandler({ target, property }, Type.STRUCT_LIST, ...typesOf);
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

        typeHandler({ target, property }, Type.PLAIN, ...typesOf);
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
export const struct = createObjectType(Type.STRUCT);

/**
 * Raw structure property type
 * @type {Function}
 */
export const raw = createObjectType(Type.STRUCT_RAW);

