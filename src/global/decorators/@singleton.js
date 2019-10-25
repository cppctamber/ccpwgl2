import { create }  from "./decorator";
import { ErrSingletonInstantiation } from "../../core";

export const singleton = create({

    class(t)
    {
        let count = 0;

        return class Singleton extends t
        {
            constructor(...args)
            {
                count++;
                if (count > 1)
                {
                    throw new ErrSingletonInstantiation({ class: t.name });
                }

                super(...args);
            }
        };
    }

});
