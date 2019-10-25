import { create } from "./decorator";

export const stage = create({

    class(value)
    {
        return function(t)
        {
            Reflect.defineMetadata("tw2:stage", value, t);
        };
    }

}, true);
