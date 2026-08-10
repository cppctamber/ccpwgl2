import { TnyClient } from "./TnyClient";
import { tnyConstructors } from "./register";
import { SetDefaultClient } from "./defaultClient";


/** Default client for the Tny runtime path. */
export const tny = new TnyClient();
tny.Register({ constructors: tnyConstructors });

// Debug helpers resolve through this rather than reaching for a global.
SetDefaultClient(tny);
