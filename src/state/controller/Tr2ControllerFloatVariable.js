import { meta } from "global"

/**
 * Tr2ControllerFloatVariable
 *
 * @property {String} name
 * @property {Number} defaultValue
 * @property {Object<String,Number>} enumValues
 * @property {Number} variableType
 */
@meta.notImplemented
@meta.type("Tr2ControllerFloatVariable", true)
export class Tr2ControllerFloatVariable
{

    @meta.black.string
    name = "";

    @meta.black.float
    defaultValue = 0;

    @meta.black.enums
    enumValues = {};

    @meta.black.uint
    variableType = 0;

    /**
     * Gets enums as a string
     * @returns {string}
     */
    GetEnumsAsString()
    {
        let str = [];
        for (const string in this.enumValues)
        {
            if (this.enumValues.hasOwnProperty(string))
            {
                str.push(`${string}=${this.enumValues[string]}`);
            }
        }

        return str.sort().join(",");
    }

}
