import { Tw2GenericStore, STORE } from "./Tw2GenericStore";
import { isFunction } from "global/util";
import { Tw2Error } from "core/Tw2Error";


export class Tw2VariableTypeStore extends Tw2GenericStore
{

    /**
     * Gets a type by value
     * @param {*} value
     * @returns {Class|Function}
     */
    GetByValue(value)
    {
        const { map } = STORE.get(this);
        for (let [ key, Ctor ] of map)
        {
            if ("isValue" in Ctor && Ctor.isValue(value)) return Ctor;
        }
        throw new ErrStoreVariableTypeNotFoundByValue({ value });
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
    static isConstructorStore =  true;


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
