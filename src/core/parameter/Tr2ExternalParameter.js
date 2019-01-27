import {isArray, isArrayLike, isNumber} from "../../global/util";
import {Tw2Parameter} from "./Tw2Parameter";

/**
 * Tr2ExternalParameter
 * TODO: Implement
 * TODO: Looks like this is for vectors only
 * @ccp Tr2ExternalParameter
 *
 * @property {String} destinationAttribute -
 * @property {*} destinationObject         -
 */
export class Tr2ExternalParameter extends Tw2Parameter
{

    destinationAttribute = "";
    destinationObject = null;

    /**
     * Gets the target value
     * @returns {null}
     */
    get value()
    {
        return this.destinationAttribute && this.destinationObject &&
        this.destinationObject[this.destinationAttribute] !== undefined ?
            this.destinationObject[this.destinationAttribute] : null;
    }

    /**
     * Gets the parameter's  size
     * @returns {Number}
     */
    get size()
    {
        const value = this.value;
        if (value == null) return 0;
        return isArrayLike(value) ? value.length : 1;
    }

    /**
     * Sets the parameter's value
     * @param {*} value
     * @param {*} [controller=this]
     * @param {Boolean} [skipUpdate]
     */
    SetValue(value, controller, skipUpdate)
    {
        if (this.EqualsValue(value)) return false;

        switch (this.size)
        {
            case 0:
                // Throw error?
                break;

            case 1:
                this.destinationObject[this.destinationAttribute] = value;
                break;

            default:
                const
                    cache = this.value,
                    len = Math.max(value.length, this.size);

                for (let i = 0; i < len; i++)
                {
                    cache[i] = value[i];
                }
        }

        if ("UpdateValues" in this.destinationObject)
        {
            if (!controller) controller = this;
            this.destinationObject.UpdateValues(controller, skipUpdate);
        }

        return true;
    }

    /**
     * Gets the parameter's value
     * @param {Boolean} [serialize]
     * @returns {null|*}
     */
    GetValue(serialize)
    {
        switch (this.size)
        {
            case 0:
                // throw error?
                return null;

            case 1:
                return this.value;

            default:
                return serialize ? Array.from(this.value) : new Float32Array(this.value);
        }
    }

    /**
     * Checks if a value equals the parameter's value
     * - Assumes the correct length array or typed array is passed
     * @param {*} value
     * @returns {Boolean}
     */
    EqualsValue(value)
    {
        switch (this.size)
        {
            case 0:
                // throw error?
                return true;

            case 1:
                return this.value === value;

            default:
                const
                    cache = this.value,
                    len = Math.min(value.length, this.size);

                for (let i = 0; i < len; i++)
                {
                    if (cache[i] !== value[i]) return false;
                }
                return true;
        }
    }

}

Tw2Parameter.define(Tr2ExternalParameter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ExternalParameter",
        props: {
            destinationAttribute: Type.STRING,
            destinationObject: Type.REF
        },
        notImplemented: ["*"]
    };
});

