/**
 * Tr2ControllerFloatVariable
 * TODO: Implement
 * @ccp Tr2ControllerFloatVariable
 *
 * @property {String} name
 * @property {Number} defaultValue
 * @property {Object<String,Number>} enumValues
 * @property {Number} variableType
 */
export class Tr2ControllerFloatVariable
{
    name = "";
    defaultValue = 0;
    enumValues = {};
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["defaultValue", r.float],
            ["enumValues", r.enums],
            ["variableType", r.uint],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}