import "core-js/stable";
import "regenerator-runtime/runtime";
import "reflect-metadata";

import { config } from "./config";
import { tw2 } from "./global";

tw2.Register(config);

export { tw2, tw2 as CCPWGL };
