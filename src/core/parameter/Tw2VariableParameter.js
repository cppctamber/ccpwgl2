import {store} from "../../global";
import {Tw2Parameter} from "./Tw2Parameter";

/**
 * Tw2VariableParameter
 *
 * @property {String} variableName
 * @class
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
        return store.GetVariable(this.variableName);
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
     * Gets the variable's value
     * @param {Boolean} [serialize]
     * @returns {?*}
     */
    GetValue(serialize)
    {
        return store.GetVariableValue(this.variableName, serialize);
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

Tw2Parameter.define(Tw2VariableParameter, Type =>
{
    return {
        type: "Tw2VariableParameter",
        props: {
            variableName: Type.STRING
        }
    };
});

