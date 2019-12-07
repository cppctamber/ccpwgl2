import { set } from "./meta";
import { decorate } from "./helpers";

export const notImplemented = decorate({
    handler({ target, property })
    {
        set("notImplemented", true, target, property);
    }
})();
