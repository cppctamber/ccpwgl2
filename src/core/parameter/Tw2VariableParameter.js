import { tw2 } from "../../global";
import { Tw2Parameter } from "./Tw2Parameter";

/**
 * Tw2VariableParameter
 *
 * @property {String} variableName
 */
export class Tw2VariableParameter extends Tw2Parameter
{

    variableName = "";

    /**
     * Constructor
     * @param {String} [name='']
     * @param {String} [variableName='']
     */
    constructor(name = "", variableName = "")
    {
        super(name);
        this.variableName = variableName;
    }

    /**
     * Gets the linked variable
     * @returns {Tw2Parameter}
     */
    get variable()
    {
        return tw2.GetVariable(this.variableName);
    }

    /**
     * Gets the linked variable's size
     * @returns {Number}
     */
    get size()
    {
        return this.variable ? this.variable.size : 0;
    }

    /**
     * Sets the variable's value
     * @param {*} value
     * @param {*} [opt]
     * @returns {Boolean}
     */
    SetValue(value, opt)
    {
        return tw2.SetVariableValue(this.variableName, value, opt);
    }

    /**
     * Gets the variable's value
     * @param {*} [out=[]]
     * @returns {?*}
     */
    GetValue(out = [])
    {
        return tw2.GetVariableValue(this.variableName, out);
    }

    /**
     * Apply
     * @param {*} a
     * @param {*} b
     * @param {*} c
     */
    Apply(a, b, c)
    {
        if (this.variable)
        {
            this.variable.Apply(a, b, c);
        }
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "variableName", r.string ]
        ];
    }

}
