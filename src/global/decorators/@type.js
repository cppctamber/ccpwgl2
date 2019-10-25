import { create } from "./decorator";
import { isBoolean, isString } from "../util";
import { Type } from "../engine/Tw2Constant";

/**
 * Type decorator
 * @type {(function(...[*]): Function)|Function}
 */
export const type = create({
    
    class(t, opt)
    {
        if (isString(opt)) opt = { name: opt };
        if (!opt.name) throw new Error("Invalid decorator usage");
        if (opt.ccp && isBoolean(opt.ccp)) opt.ccp = opt.name;
        Reflect.defineMetadata("tw2:type", opt, t);
    },
    
    parameter(t, p, d, type)
    {
        if (isString(type)) type = Type[type.toUpperCase()];
        if (type === undefined) throw new Error("Invalid type: " + name);
        Reflect.defineMetadata("tw2:type", type, t, p);
    }
    
}, true);

/**
 * Creates a type decorator
 * @param type
 * @returns {(function(...[*]): Function)|Function}
 */
function createType(type)
{
    return create({
        parameter(t, p)
        {
            Reflect.defineMetadata("tw2:type", type, t, p);
        }
    });
}

export const boolean = createType(Type.BOOLEAN);
export const string = createType(Type.STRING);
export const path = createType(Type.PATH);
export const expression = createType(Type.EXPRESSION);
export const float = createType(Type.FLOAT);
export const uint = createType(Type.UINT);
export const byte = createType(Type.BYTE);
export const integer = createType(Type.INTEGER);
export const plain = createType(Type.PLAIN);
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
