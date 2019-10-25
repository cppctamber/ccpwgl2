import { create } from "./decorator";

export const notImplemented = create({

    handler(t, p)
    {
        Reflect.defineMetadata("tw2:notImplemented", true, t, p);
    }

});
