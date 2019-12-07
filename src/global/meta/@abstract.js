import { ErrAbstractClass, ErrAbstractMethod } from "core/Tw2Error";
import { decorate } from "./helpers";

/**
 * Abstract class/ method decorator
 * @type {ClassDecorator|MethodDecorator}
 */
export const abstract = decorate({

    class({ target })
    {
        return class Abstract extends target
        {
            constructor()
            {
                super();

                if (this.constructor === Abstract)
                {
                    throw new ErrAbstractClass({ class: target.name });
                }

            }
        };
    },

    method({ property, descriptor })
    {
        descriptor.value = function()
        {
            throw new ErrAbstractMethod({ method: property });
        };
        return descriptor;
    }

})();
