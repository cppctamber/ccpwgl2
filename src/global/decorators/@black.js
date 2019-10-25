import { create } from "./decorator";

export const black = create({

    class()
    {
        return function(t)
        {
            Reflect.defineMetadata("tw2:black", true, t);
        };
    },

    property(t, p, d)
    {
        Reflect.defineMetadata("tw2:black", true, t, p);
    }

});

export const blackReader = create({

    property(t, p, d, reader)
    {
        Reflect.defineMetadata("tw2:black", reader, t, p);
    }

}, true);
