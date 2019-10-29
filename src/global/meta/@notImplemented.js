import { create, set } from "./meta";

export const notImplemented = create(false, {

    handler({ target, property })
    {
        set("notImplemented", true, target, property);
    }

});
