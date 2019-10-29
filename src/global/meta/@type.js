import { Type } from "../engine/Tw2Constant";
import { isString } from "../util/type";
import { set, create } from "./meta";

/**
 * Handles property type meta data
 * @param {*} target
 * @param {String} property
 * @param {PropertyDescriptor }descriptor
 * @param {String|Number} type
 * @param {Array} [childTypes]
 */
function handleType(target, property, descriptor, type, childTypes)
{
    console.log("Handling type", type, "on property", property);

    // Allow type to be passed as a string
    if (isString(type)) type = Type[type.toUpperCase()];
    if (type === undefined) type = Type.UNKNOWN;
    
    // Update meta data
    set("type", type, target, property);
    if (childTypes && childTypes.length) set("childTypes", childTypes, target, property);

    // Automatic meta data
    if (property.charAt(0) === "_") set("private", true, target, property);
    if (descriptor.value === null) set("nullable", true, target, property);
}

/**
 * Type decorator
 */
export const type = create(true, {

    class({ target }, name, ...childTypes)
    {
        set("type", name, target);
        if (childTypes && childTypes.length) set("childTypes", childTypes, target);
    },

    parameter({ target, property, descriptor }, type, ...childTypes)
    {
        handleType(target, property, descriptor, type, childTypes);
    }

});

/**
 * Type factory
 */
function createType(type)
{
    return create(false, {

        parameter({ target, property, descriptor })
        {
            handleType(target, property, descriptor, type);
        }
        
    });
}

/**
 * Object Type factory
 */
function createTypeOf(type)
{
    return create(true, {

        parameter({ target, property, descriptor }, ...childTypes)
        {
            handleType(target, property, descriptor, type, childTypes);
        }

    });
}


export const listOf = createTypeOf(Type.LIST);
export const objectOf = createTypeOf(Type.OBJECT);
export const plainOf = createTypeOf(Type.PLAIN);
export const unknown = createType(Type.UNKNOWN);
export const boolean = createType(Type.BOOLEAN);
export const string = createType(Type.STRING);
export const path = createType(Type.PATH);
export const expression = createType(Type.EXPRESSION);
export const float = createType(Type.FLOAT);
export const uint = createType(Type.UINT);
export const byte = createType(Type.BYTE);
export const object = createType(Type.OBJECT);
export const raw = createType(Type.RAW);
export const list = createType(Type.LIST);
export const array = createType(Type.ARRAY);
export const vector2 = createType(Type.VECTOR2);
export const vector3 = createType(Type.VECTOR3);
export const vector4 = createType(Type.VECTOR4);
export const color = createType(Type.COLOR);
export const quaternion = createType(Type.QUATERNION);
export const matrix3 = createType(Type.MATRIX3);
export const matrix4 = createType(Type.MATRIX4);
export const indexBuffer = createType(Type.INDEX_BUFFER);
export const plain = createType(Type.PLAIN);
