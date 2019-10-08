import "core-js/stable";
import "regenerator-runtime/runtime";

import { config } from "./config";
import { tw2 } from "./global";

tw2.Register(config);

const ccpwgl_int = tw2;

export { tw2, ccpwgl_int };
