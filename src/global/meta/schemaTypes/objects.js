import { isArray, isEqual, isPlain } from "utils/type";
import { PT_ARRAY, PT_PLAIN } from "constant/type";

// TODO: Do this properly
export const plain = {
    get: (obj, prop) => Object.assign({}, obj[prop]),
    set: (obj, prop, value) => Object.assign(obj[prop], value),
    is: isPlain,
    equals: isEqual,
    Ctor: Object,
    decorator: dec => dec({ type: PT_PLAIN }, true)
};

// TODO: Do this properly
export const array = {
    get: (obj, prop) => Array.from(obj[prop]),
    set: (obj, prop, value) => obj[prop] = Array.from(value),
    is: isArray,
    equals: (a, b) =>
    {
        if (a === b) return true;
        if (a.length !== b.length) return false;

        for (let i = 0; i < a.length; i++)
        {
            if (a[i] !== b[i]) return false;
        }
        return true;
    },
    Ctor: Array,
    decorator: dec => dec({ type: PT_ARRAY }, true)
};
