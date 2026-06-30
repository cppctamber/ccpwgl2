import "core-js/stable";
import "regenerator-runtime/runtime";
import "reflect-metadata";

import { config } from "./config";
import { tw2 } from "./global";
import { api } from "api";
import { shaders as deprecatedShaders } from "./toDeprecate/shaders";

tw2.util.api = api;
tw2.Register(config);
tw2.Register({ shaders: deprecatedShaders });

export { tiny } from "./wrapped";
export { deprecatedShaders };
export { tw2, tw2 as CCPWGL };

