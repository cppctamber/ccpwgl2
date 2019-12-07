import { ErrSingletonInstantiation } from "core/Tw2Error";
import { decorate } from "./helpers";

export const singleton = decorate({
    class({ target })
    {
        let count = 0;
        return class Singleton extends target
        {
            constructor(...args)
            {
                count++;
                if (count > 1) throw new ErrSingletonInstantiation({ class: target.name });
                super(...args);
            }
        };
    }
})();
