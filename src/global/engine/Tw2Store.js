import {isString, isPlain, isArray, isFunction, toArray, isUndefined, enableUUID} from "../util";
import {Tw2EventEmitter} from "../../core/Tw2EventEmitter";
import {logger} from "./Tw2Logger";
import {resMan} from "./Tw2ResMan";

/**
 * Stores engine data
 *
 * @property {Object.< string, string>} _path
 * @property {Object.< string, Array<string>>} _dynamicPath
 * @property {Object.< string, Tw2Parameter>} _variable
 * @property {Object.< string, Function>} _type
 * @property {Object.< string, Function>} _extension
 * @property {Object.< string, Function>} _class
 * @property {Object.< string, Tw2Schema>} _schema
 * @property {Object.< string, Array<string>>} _missing
 * @class
 */
class Tw2Store extends Tw2EventEmitter
{

    _type = {};
    _path = {};
    _variable = {};
    _extension = {};
    _class = {};
    _dynamicPath = {};
    _schema = {};
    _missing = {};


    /**
     * Checks if a resource path exists
     * @param {String} prefix
     * @returns {Boolean}
     */
    HasPath(prefix)
    {
        return (prefix && prefix in this._path);
    }


    /**
     * Gets a path by it's prefix
     * @param {String} prefix
     * @returns {?String}
     */
    GetPath(prefix)
    {
        return Tw2Store.GetStoreItem(this, "path", prefix);
    }

    /**
     * Registers a resource path
     * @param {String} prefix
     * @param {String} path
     * @returns {Boolean}
     */
    RegisterPath(prefix, path)
    {
        if (path.lastIndexOf("/") !== path.length - 1)
        {
            path += "/";
        }

        if (Tw2Store.RestrictedPathPrefixes.includes(prefix))
        {
            this.emit("error", {
                type: "path",
                key: prefix,
                value: path,
                log: {
                    type: "error",
                    message: `Cannot register restricted prefix "${prefix}"`
                }
            });
            return false;
        }

        return Tw2Store.SetStoreItem(this, "path", prefix, path, isString);
    }

    /**
     * Registers resource paths from an object or an array of objects
     * @param {{string:String}|Array<{String:String}>} obj
     * @returns {Boolean}
     */
    RegisterPaths(obj)
    {
        return Tw2Store.RegisterFromObject(this, "RegisterPath", obj);
    }

    /**
     * Checks if a dynamic path exists
     * @param {String} prefix
     * @returns {Boolean}
     */
    HasDynamicPath(prefix)
    {
        return (prefix && prefix in this._dynamicPath);
    }

    /**
     * Gets a dynamic path by it's prefix
     * @param {String} prefix
     * @returns {?Array<string>}
     */
    GetDynamicPath(prefix)
    {
        return Tw2Store.GetStoreItem(this, "dynamicPath", prefix);
    }

    /**
     * Registers a dynamic path
     * @param {String} prefix
     * @param {String[]} paths
     * @returns {Boolean}
     */
    RegisterDynamicPath(prefix, paths)
    {
        return Tw2Store.SetStoreItem(this, "dynamicPath", prefix, paths, isArray);
    }

    /**
     * Registers dynamic paths from an object or array of objects
     * @param {{string:string[]}|Array<{String:string[]}>} obj
     * @returns {Boolean}
     */
    RegisterDynamicPaths(obj)
    {
        return Tw2Store.RegisterFromObject(this, "RegisterDynamicPath", obj);
    }

    /**
     * Checks if an extension exists
     * @param {String} ext
     * @returns {Boolean}
     */
    HasExtension(ext)
    {
        return (ext && ext in this._extension);
    }

    /**
     * Gets a resource extension by name
     * @param {String} ext
     * @returns {?Function}
     */
    GetExtension(ext)
    {
        return Tw2Store.GetStoreItem(this, "extension", ext);
    }

    /**
     * Registers a resource extension
     * @param {String} ext
     * @param {Function} Constructor
     * @returns {Boolean}
     */
    RegisterExtension(ext, Constructor)
    {
        return Tw2Store.SetStoreItem(this, "extension", ext, Constructor, isFunction);
    }

    /**
     * Registers resource extensions from an object or array of objects
     * @param {{string:Function}|Array<{String:Function}>} obj
     * @returns {Boolean}
     */
    RegisterExtensions(obj)
    {
        return Tw2Store.RegisterFromObject(this, "RegisterExtension", obj);
    }

    /**
     * Checks if a constructor exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasClass(name)
    {
        return (name && name in this._class);
    }

    /**
     * Gets a library constructor by name
     * @param {String} name
     * @returns {?Function}
     */
    GetClass(name)
    {
        let Constructor = Tw2Store.GetStoreItem(this, "class", name);

        // Allow substitution of Trinity constructors with Tw2 constructors
        if (!Constructor && (name.includes("Tr2") || name.includes("Tri")))
        {
            const substitute = "Tw2" + name.substring(3);
            Constructor = Tw2Store.GetStoreItem(this, "class", substitute);
            if (Constructor)
            {
                this.emit("substitute", {
                    type: "class",
                    key: substitute,
                    originalKey: name,
                    value: Constructor,
                    log: {
                        type: "warning",
                        message: `"${name}" class not found, substituting with "${substitute}"`
                    }
                });
            }
        }

        // Create a warning when a staging class is called
        if (Constructor && Constructor.__isStaging)
        {
            this.emit("staging", {
                type: "class",
                key: name,
                value: Constructor,
                log: {
                    type: "warning",
                    message: `"${name}" class is in development`
                }
            });
        }

        return Constructor;
    }

    /**
     * Registers library constructors
     * @param {String} name
     * @param {Function} Constructor
     * @returns {Boolean}
     */
    RegisterClass(name, Constructor)
    {
        return Tw2Store.SetStoreItem(this, "class", name, Constructor, isFunction);
    }

    /**
     * Registers library constructors from an object or array of objects
     * @param {{string:Function}|Array<{String:Function}>} obj
     * @returns {Boolean}
     */
    RegisterClasses(obj)
    {
        return Tw2Store.RegisterFromObject(this, "RegisterClass", obj);
    }

    /**
     * Checks if a variable exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasVariable(name)
    {
        return (name && name in this._variable);
    }

    /**
     * Gets a variable by name
     * @param {String} name
     * @returns {?*}
     */
    GetVariable(name)
    {
        return Tw2Store.GetStoreItem(this, "variable", name);
    }

    /**
     * Gets a variable's value
     * @param {String} name
     * @param {Boolean} [serialize]
     * @returns {?*} null if the variable doesn't exist or it does but it has no GetValue method
     */
    GetVariableValue(name, serialize)
    {
        const variable = this.GetVariable(name);
        return variable && variable.GetValue ? variable.GetValue(serialize) : null;
    }

    /**
     * Sets a variable's value
     * @param {String} name
     * @param {*} value
     * @returns {?Boolean} null if the variable doesn't exist or it does but has no SetValue method
     */
    SetVariableValue(name, value)
    {
        const variable = this.GetVariable(name);
        if (variable && variable.SetValue)
        {
            variable.SetValue(value);
            return true;
        }
        return null;
    }

    /**
     * Registers a variable
     * @param {String} name
     * @param {*|{value:*, Type: string|Function}} [value]
     * @param {String|Function} [Type]
     * @returns {?*}
     */
    RegisterVariable(name, value, Type)
    {
        const variable = this.CreateType(name, value, Type);
        Tw2Store.SetStoreItem(this, "variable", name, variable);
        return variable;
    }

    /**
     * Registers variables from an object or array of objects
     * @param {{string:*|{value:*,type:string|Function}|Array<{String:*|{value:*,type:string|Function}>}} obj
     */
    RegisterVariables(obj)
    {
        return Tw2Store.RegisterFromObject(this, "RegisterVariable", obj);
    }

    /**
     * Gets a parameter constructor by it's short name
     * @param {String} name
     * @returns {?Function}
     */
    GetType(name)
    {
        return Tw2Store.GetStoreItem(this, "type", name);
    }

    /**
     * Checks if a type exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasType(name)
    {
        return (name && name in this._type);
    }

    /**
     * Gets a type by value
     * @param {*} value
     * @returns {?Function}
     */
    GetTypeByValue(value)
    {
        for (let type in this._type)
        {
            if (this._type.hasOwnProperty(type) && "isValue" in this._type[type])
            {
                if (this._type[type]["isValue"](value))
                {
                    return this._type[type];
                }
            }
        }
        return null;
    }

    /**
     * Creates a type by value and/or type name or function
     * @param {String} name
     * @param {?*} [value]
     * @param {?|string|Function} [Type]
     * @returns {?*} new parameter
     */
    CreateType(name, value, Type)
    {
        if (isPlain(value))
        {
            Type = value["Type"] || value["type"];
            value = value["value"];
        }

        if (!Type)
        {
            Type = this.GetTypeByValue(value);
        }

        if (isString(Type))
        {
            Type = this.GetType(Type);
        }

        if (isFunction(Type))
        {
            return new Type(name, value);
        }

        return null;
    }

    /**
     * Registers a parameter type
     * @param {String} name
     * @param {Function} Constructor
     * @returns {Boolean}
     */
    RegisterType(name, Constructor)
    {
        return Tw2Store.SetStoreItem(this, "type", name, Constructor, isFunction);
    }

    /**
     * Registers parameter types from an object or array of objects
     * @param {{string: Function}|[{String:Function}]} obj
     * @returns {Boolean}
     */
    RegisterTypes(obj)
    {
        return Tw2Store.RegisterFromObject(this, "RegisterType", obj);
    }

    /**
     * Checks if a schema exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasSchema(name)
    {
        return (name && name in this._schema);
    }


    /**
     * Gets a schema by it's name
     * @param {String} name
     * @returns {?String}
     */
    GetSchema(name)
    {
        return Tw2Store.GetStoreItem(this, "schema", name);
    }

    /**
     * Registers a schema
     * @param {String} name
     * @param {String} schema
     * @returns {Boolean}
     */
    RegisterSchema(name, schema)
    {
        return Tw2Store.SetStoreItem(this, "schema", name, schema, a =>
        {
            return a && a.constructor.name === "Tw2Schema";
        });
    }

    /**
     * Registers schemas from an object or an array of objects
     * @param {{string:String}|Array<{String:String}>} obj
     * @returns {Boolean}
     */
    RegisterSchemas(obj)
    {
        return Tw2Store.RegisterFromObject(this, "RegisterSchema", obj);
    }

    /**
     * Registers store values
     * @param {{}} [opt={}]
     * @param {Boolean} [opt.uuid]
     * @param {*} opt.logger
     * @param {*} opt.paths
     * @param {*} opt.dynamicPaths
     * @param {*} opt.types
     * @param {*} opt.classes
     * @param {*} opt.extensions
     * @param {*} opt.variables
     * @param {*} opt.schemas
     */
    Register(opt = {})
    {
        if ("uuid" in opt) enableUUID(opt.uuid);
        if ("logger" in opt) logger.Set(opt.logger);
        if ("resMan" in opt) resMan.Set(opt.resMan);

        this.RegisterPaths(opt.paths);
        this.RegisterDynamicPaths(opt.dynamicPaths);
        this.RegisterTypes(opt.types);
        this.RegisterClasses(opt.classes);
        this.RegisterExtensions(opt.extensions);
        this.RegisterVariables(opt.variables);
        this.RegisterSchemas(opt.schemas);
    }

    /**
     * Gets a value from a store
     * - Records missing keys for debugging
     * @param {Tw2Store} store
     * @param {String} type
     * @param {String} key
     * @returns {?*}
     */
    static GetStoreItem(store, type, key)
    {
        const storeSet = store["_" + type];
        if (storeSet && isString(key))
        {
            if (key in storeSet)
            {
                return storeSet[key];
            }

            if (!store._missing[type])
            {
                store._missing[type] = [];
            }

            if (!store._missing[type].includes(key))
            {
                store._missing[type].push(key);
            }

            store.emit("missing", {
                type, key,
                log: {
                    type: "debug",
                    message: `Missing ${type}: "${key}"`
                }
            });
        }

        return null;
    }

    /**
     * Sets a store value
     * @param {Tw2Store} store
     * @param {String} type
     * @param {String} key
     * @param {*} value
     * @param {Function} [validator]
     * @returns {Boolean} true if successful
     */
    static SetStoreItem(store, type, key = "", value, validator)
    {
        if (validator && !validator(value))
        {
            store.emit("error", {
                type, key, value,
                log: {
                    type: "error",
                    message: `Invalid ${type}: "${key}"`,
                }
            });
            return false;
        }

        const storeSet = store["_" + type];
        if (storeSet && isString(key) && !isUndefined(value))
        {
            const oldValue = storeSet[key];
            storeSet[key] = value;
            store.emit("registered", {
                type, key, value, oldValue,
                log: {
                    type: "debug",
                    message: `${oldValue ? "Re-registered" : "Registered"} ${type} "${key}"`
                }
            });
            return true;
        }
        return false;
    }

    /**
     * Converts an object or array of objects into single function calls
     * @param {Tw2Store} store
     * @param {String} funcName
     * @param {Array|Object} obj
     * @returns {Boolean}
     */
    static RegisterFromObject(store, funcName, obj)
    {
        if (obj && funcName in store)
        {
            obj = toArray(obj);
            for (let i = 0; i < obj.length; i++)
            {
                for (let key in obj[i])
                {
                    if (obj[i].hasOwnProperty(key))
                    {
                        store[funcName](key, obj[i][key]);
                    }
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Restricted path prefixes
     * @type {String[]}
     */
    static RestrictedPathPrefixes = ["dynamic", "rgba"];

    /**
     * Class category
     * @type {String}
     */
    static category = "variable_store";

}


export const store = new Tw2Store();