import { TnyClient } from "./TnyClient";
import { tnyConstructors } from "./register";


/** Default client for the Tny runtime path. */
export const tny = new TnyClient();
tny.Register({ constructors: tnyConstructors });
