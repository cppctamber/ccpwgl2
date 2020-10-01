import { isFunction, template } from "global/util";

const HAS_CAPTURE_STACK_TRACE = isFunction(Error["captureStackTrace"]);

/**
 * Tw2Error
 *
 * @property {String} name    - The error's name
 * @property {String} message - The error's message
 * @property {Object} data    - Optional error data
 */
export class Tw2Error extends Error
{
    /**
     * Constructor
     * @param {String|Object} [data={}]                   - Error message or an object containing relevant data
     * @param {String} [defaultMessage='Undefined Error'] - The default error message
     */
    constructor(data = {}, defaultMessage = "Undefined error")
    {
        let message = defaultMessage;
        if (typeof data === "string")
        {
            message = data;
            data = {};
        }
        else if (data.message)
        {
            message = data.message;
            delete data.message;
        }

        super();
        this.message = template(message, data);
        this.name = this.constructor.name;
        this.data = data;

        if (HAS_CAPTURE_STACK_TRACE)
        {
            Error["captureStackTrace"](this, Tw2Error);
        }
        else
        {
            this.stack = (new Error(this.message)).stack;
        }
    }

    /**
     * Emits an event on a target emitter
     * @param {*} emitter
     * @param {String} [eventName='error']
     * @returns {Tw2Error}
     */
    emitOn(emitter, eventName = "error")
    {
        if (emitter && emitter.emit)
        {
            emitter.emit(eventName, this);
        }
        return this;
    }

}


/**
 * Throws when a feature is not implemented
 */
export class ErrFeatureNotImplemented extends Tw2Error
{
    constructor(data)
    {
        super(data, "%feature=Feature% not implemented");
    }
}

/**
 * Throws when an index is out of bounds
 */
export class ErrIndexBounds extends Tw2Error
{
    constructor(data)
    {
        super(data, "Array index out of bounds");
    }
}

/**
 * Throws when invalid wrapped objects are passed as arguments
 */
export class ErrWrapped extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid wrapped object(s) (%reason%)");
    }
}
