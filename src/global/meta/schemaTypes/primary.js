import {
    PT_BOOLEAN,
    PT_BYTE,
    PT_ENUM,
    PT_EXPRESSION,
    PT_FLOAT,
    PT_PATH,
    PT_STRING,
    PT_UINT,
    PT_UNKNOWN,
    PT_USHORT
} from "constant/type";

import { isBoolean, isNumber, isString } from "utils/type";
import { toArray } from "utils/arr";

const
    get = (obj, prop) => obj[prop],
    set = (obj, prop, value) => obj[prop] = value,
    equals = (a, b) => a === b;

function createPrimaryType(type, Ctor, is)
{
    return {
        type,
        is,
        equals,
        get,
        set,
        Ctor,
        decorate: dec => dec({ type }, true)
    };
}

export const unknown = createPrimaryType(PT_UNKNOWN, null, () => true);

export const boolean = createPrimaryType(PT_BOOLEAN, Boolean, isBoolean);

export const string = createPrimaryType(PT_STRING, String, isString);
export const path = createPrimaryType(PT_PATH, String, isString);
export const expression = createPrimaryType(PT_EXPRESSION, String, isString);

export const byte = createPrimaryType(PT_BYTE, Number, isNumber);
export const uint = createPrimaryType(PT_UINT, Number, isNumber);
export const ushort = createPrimaryType(PT_USHORT, Number, isNumber);
export const float = createPrimaryType(PT_FLOAT, Number, isNumber);

export const enums = {
    type: PT_ENUM,
    is: (a, rule) => rule.enums && rule.enums.includes(a),
    equals,
    get,
    set,
    decorator: dec => enums => dec({ type: PT_ENUM, enums: toArray(enums) }, true)
};
