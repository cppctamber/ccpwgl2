import { create } from "./decorator";
import { desc } from "./@desc";
import { type } from "./@type";

export const prop = create({

    property(t, p, d, propType, propDesc)
    {
        type(propType)(t, p, d);
        desc(propDesc)(t, p, d);
    }

}, true);
