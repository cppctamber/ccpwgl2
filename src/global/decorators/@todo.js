import { create } from "./decorator";

export const todo = create({

    handler(t, p, d, text="")
    {
        Reflect.defineMetadata("tw2:todo", text, t, p);
    }

}, true);
