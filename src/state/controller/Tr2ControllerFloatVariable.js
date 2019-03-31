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

}