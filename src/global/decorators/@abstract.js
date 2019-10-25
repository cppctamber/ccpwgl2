import { create } from "./decorator";
import { ErrAbstractClass, ErrAbstractMethod } from "../../core";

export const abstract = create({

    class(t)
    {
        return class Abstract extends t
        {
            constructor()
            {
                super();

                if (this.constructor === Abstract)
                {
                    throw new ErrAbstractClass({ class: t.name });
                }

            }
        };
    },

    method(t, p, d)
    {
        d.value = function()
        {
            throw new ErrAbstractMethod({ method: p });
        };
        return d;
    }

});
