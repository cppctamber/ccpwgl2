import { meta } from "utils";
import { store } from "global";
import { Tw2Parameter } from "./Tw2Parameter";


@meta.ctor("Tw2VariableParameter", "TriVariableParameter")
export class Tw2VariableParameter extends Tw2Parameter
{

    @meta.string
    name = "";

    @meta.string
    variableName = "";


    /**
     * Constructor
     * @param {String} [name]
     * @param {String} [variableName]
     */
    constructor(name, variableName)
    {
        super();
        if (name) this.name = name;
        if (variableName) this.variableName = variableName;
    }

    /**
     * Gets the linked variable
     * @returns {Tw2Parameter}
     */
    get variable()
    {
        return store.variables.Get(this.variableName);
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
        return store.variables.SetValue(this.variableName, value, opt);
    }

    /**
     * Gets the variable's value
     * @param {*} [out=[]]
     * @returns {?*}
     */
    GetValue(out = [])
    {
        return store.variables.GetValue(this.variableName);
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

}
