import { create } from "./decorator";

export const ccpwgl = create({

    parameter()
    {
        return function(t, p)
        {
            Reflect.defineMetadata("tw2:ccpwgl", true, t, p);
            Reflect.defineMetadata("tw2:black", false, t, p);
        };
    }

});
