import { Tw2GenericStore } from "core/store/Tw2GenericStore";
import { isArray, isPlain } from "utils/type";


export class Tw2SchemaStore extends Tw2GenericStore
{

    /**
     * Sets a schema by name or names
     * @param {String|Array<String>} name
     * @param {Object} schema
     */
    Set(name, schema)
    {
        if (isArray(name))
        {
            for (let i = 0; i < name.length; i++)
            {
                this.Set(name[i], schema);
            }
            return;
        }

        super.Set(name, schema);
    }

    /**
     * Checks if a value is a valid store value
     * @param {*} value
     * @returns {boolean}
     */
    static isValue(value)
    {
        return isPlain(value);
    }

    /**
     * Store name
     * @type {string}
     */
    static storeName = "Schema";

}
