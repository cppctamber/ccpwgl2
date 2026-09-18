import { Tw2GenericStore, STORE } from "./Tw2GenericStore";
import { isFunction } from "utils";
import { Tw2Error } from "../Tw2Error";


export class Tw2VariableTypeStore extends Tw2GenericStore
{

    /**
     * Gets a type by value
     * @param {*} value
     * @returns {Class|Function}
     */
    GetByValue(value)
    {
        const Ctor = this.FindByValue(value);
        if (!Ctor) throw new ErrStoreVariableTypeNotFoundByValue({ value });
        return Ctor;
    }

    /**
     * The variable type that can hold a value, or null when none can.
     *
     * The same search as `GetByValue` without the throw, so a caller that can
     * reasonably do without a variable can ask first rather than be told.
     * @param {*} value
     * @returns {Function|null}
     */
    FindByValue(value)
    {
        const { map } = STORE.get(this);
        for (let [ key, Ctor ] of map)
        {
            if ("isValue" in Ctor && Ctor.isValue(value)) return Ctor;
        }
        return null;
    }

    /**
     * Checks if a value is a valid store value
     * @param {*} value
     * @returns {boolean}
     */
    static isValue(value)
    {
        return isFunction(value);
    }

    /**
     * Identifies stores that use classes
     * @type {boolean}
     */
    static isConstructorStore = true;


    /**
     * The store's name
     * @type {string}
     */
    static storeName = "Variable Type";

}

/**
 * Throws when a variable type cannot be identified
 */
export class ErrStoreVariableTypeNotFoundByValue extends Tw2Error
{
    constructor(data)
    {
        super(data, "Could not identify variable type from value (%value%)");
    }
}
