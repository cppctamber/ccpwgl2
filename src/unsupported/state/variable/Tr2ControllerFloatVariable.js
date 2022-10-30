import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2ControllerFloatVariable")
export class Tr2ControllerFloatVariable
{

    @meta.string
    name = "";

    @meta.float
    defaultValue = 0;

    @meta.enums()
    enumValues = {};

    @meta.uint
    variableType = 0;

    @meta.float
    value = 0;

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
