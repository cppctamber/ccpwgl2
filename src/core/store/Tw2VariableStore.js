import { Tw2GenericStore, STORE } from "./Tw2GenericStore";
import { isFunction, isPlain, isString } from "utils";


export class Tw2VariableStore extends Tw2GenericStore
{
    /**
     * Constructor
     * @param {Tw2VariableTypeStore} typeStore
     */
    constructor(typeStore)
    {
        super();
        STORE.get(this).typeStore = typeStore;
    }

    /**
     * Sets a store key value
     * @param {String}  key
     * @param {*} value
     * @returns {Function}
     */
    Set(key, value)
    {
        if (!isPlain(value))
        {
            value = this.Create(key, value);
        }

        return super.Set(key, value);
    }

    /**
     * Creates a variable from a value
     * @param {String} name
     * @param {Object|String|Number|Float32Array}value
     * @param {Function|Class} [Type]
     * @returns {*}
     */
    Create(name, value, Type)
    {
        if (isPlain(value))
        {
            Type = value["Type"] || value["type"];
            value = value["value"];
        }

        if (isFunction(Type)) return new Type(name, value);

        const { typeStore } = STORE.get(this);

        if (isString(Type)) Type = typeStore.Get(Type);
        if (!Type) Type = typeStore.GetByValue(value);

        return new Type(name, value);
    }

    /**
     * Sets a variables value
     * @param {String} name
     * @param {*} value
     * @param {Object} [opt]
     */
    SetValue(name, value, opt)
    {
        const variable = this.Get(name);
        return variable.SetValue(value, opt);
    }

    /**
     * Gets a variable's value
     * @param {String} name
     * @returns {Number|?String|Array|Float32Array}
     */
    GetValue(name)
    {
        const variable = this.Get(name);
        return variable.GetValue(name);
    }

    /**
     * Checks if a value is a valid store value
     * @param {*} value
     * @returns {boolean}
     */
    static isValue(value)
    {
        return value && isFunction(value.GetValue) && isFunction(value.SetValue);
    }


    /**
     * The store's name
     * @type {string}
     */
    static storeName = "Variable";

}
