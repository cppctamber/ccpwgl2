import { num } from "math";
import * as Type from "constant/type";
import {
    isArray,
    isBoolean,
    isEqual,
    isNumber,
    isPlain,
    isString,
    isVector,
    isVectorEqual
} from "../utils/type";

export const propTypes = new Map();

//  Helpers
const getArray = (a, key) => a[key] ? Array.from(a[key]) : [];
const getPrimary = (a, key) => a[key];
const setPrimary = (a, key, value) => a[key] = value;
const exactEquals = (a, b) => a === b;
const returnFalse = () => false;
const notImplemented = () => { throw new ReferenceError("Not implemented"); };


// Boolean
propTypes.set(Type.PT_BOOLEAN, {
    is: isBoolean,
    equals: exactEquals,
    get: getPrimary,
    set: setPrimary,
    type: Type.PT_BOOLEAN
});


// Numbers
function setNumber(type)
{
    propTypes.set(type, {
        is: isNumber,
        equals: num.equals,
        get: getPrimary,
        set: setPrimary,
        type
    });
}

setNumber(Type.PT_BYTE);
setNumber(Type.PT_FLOAT);
setNumber(Type.PT_UINT);
setNumber(Type.PT_USHORT);


//  Strings
function setString(type)
{
    propTypes.set(type, {
        is: isString,
        equals: exactEquals,
        get: getPrimary,
        set: setPrimary,
        type
    });
}
setString(Type.PT_STRING);
setString(Type.PT_EXPRESSION);
setString(Type.PT_PATH);


// Vectors
function setVector(type, Constructor, length)
{
    let is = length ? x => isVector(x, length) : isVector;

    propTypes.set(type, {
        is,
        equals: isVectorEqual,
        get: getArray,
        set: (a, key, value) =>
        {
            if (a[key].length !== value.length)
            {
                a[key] = new Constructor(value);
            }
            else
            {
                a[key].set(value);
            }
        },
        length,
        type
    });
}


// Setup all vectors
for (const type in Type.VectorConstructors)
{
    if (Type.VectorConstructors.hasOwnProperty(type))
    {
        let id = Number(type);
        setVector(id, Type.VectorConstructors[id], Type.VectorLengths[id]);
    }
}


// Objects
propTypes.set(Type.PT_PLAIN, {
    is: isPlain,
    equals: isEqual,
    get: (a, key) => Object.assign({}, a[key]),
    set: (a, key, value) => Object.assign(a[key], value),
    type: Type.PT_PLAIN
});

function setStruct(type)
{
    propTypes.set(type, {
        is(value)
        {
            if (!isPlain(value)) return false;
            // TODO:  Handle struct type checking...
            return true;
        },
        equals: exactEquals,
        get(a, key, options)
        {
            return a[key] === null ? null : a[key].GetValues({}, options);
        },
        set: (a, key, value, opt) =>
        {
            notImplemented();
            /*
            // Delete
            if (value === null)
            {
                if (!a[key]) return false;
                a[key].Destroy(opt);
                a[key] = null;
                return true;
            }

            const types = toArray(getMetadata("type", a, key));

            // Create
            if (!a[key])
            {

            }

            // TODO: check between current and new
            a[key].ClearItems({ skipUpdate: true });
            return a[key].SetValues(value);
             */
        },
        type
    });
}

setStruct(Type.PT_STRUCT);
setStruct(Type.PT_STRUCT_RAW);

propTypes.set(Type.PT_STRUCT_LIST, {
    is(value)
    {
        if (!isArray(value)) return false;
        // TODO: Handle struct type checking...
        return true;
    },
    equals: exactEquals,
    get(a, key, options)
    {
        const len = a[key].length;
        if (!len) return null;
        let out = [];
        for (let i = 0; i < len; i++)
        {
            try
            {
                out.push(a[key][i].GetValues({}, options));
            }
            catch (err)
            {
                console.dir(a[key][i]);
                throw err;
            }
        }
        return out;
    },
    set: (a, key, value, options) =>
    {
        notImplemented();
        /*
        if (value === null)
        {
            if (!a[key].length) return false;
            for (let i = 0; i < a[key].length; i++)
            {
                a[key].Destroy(options);
            }
            a[key].splice(0);
            return true;
        }

        let updated = false;

        for (let i = 0; i < value.length; i++)
        {
            const { _id, ...values } = value[i];

            // No id - we are adding...
            if (!_id)
            {
                // identify the constructor
            }
            else
            {
                // Find existing id
                let found;
                for (let x = 0; x < a[key].length; x++)
                {
                    if (a[key]._id === _id)
                    {
                        found = a[key];
                        break;
                    }
                }

                // Update
                if (found)
                {
                    if (a[key].SetValues(values))
                    {
                        updated = true;
                    }
                }
                // Insert
                else
                {
                    throw new Error("Inserting records not yet supported");
                }
            }

            return updated;
        }
        */
    },
    type: Type.PT_STRUCT_LIST
});


