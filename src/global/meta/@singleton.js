import { ErrSingletonInstantiation } from "core/Tw2Error";
import { create }  from "./meta";

export const singleton = create(false, {

    class({ target })
    {
        let count = 0;

        return class Singleton extends target
        {
            constructor(...args)
            {
                count++;
                if (count > 1)
                {
                    throw new ErrSingletonInstantiation({ class: target.name });
                }

                super(...args);
            }
        };
    }

});
