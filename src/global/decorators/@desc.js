import { create } from "./decorator";

export const desc = create({

    handler(t, p, d, text="")
    {
        Reflect.defineMetadata("tw2:desc", text, t, p);
    }

}, true);
