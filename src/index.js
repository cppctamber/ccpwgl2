import "core-js/stable";
import "regenerator-runtime/runtime";
import "reflect-metadata";

import { config } from "./config";
import { tw2 } from "./global";
import * as runtime from "./runtime";
import { shaders as deprecatedShaders } from "./toDeprecate/shaders";

tw2.runtime = runtime;
tw2.Register(config);
tw2.Register({ shaders: deprecatedShaders });

export { tiny } from "./wrapped";
export { deprecatedShaders };
export { tw2, tw2 as CCPWGL };

// CEWG (translated DX11 shader path) support modules — exposed for the
// upload layer's consumers and the hlslreader parity harness.
export { CewgLightList } from "./core/cewg/CewgLightList";
export { CewgLightCuller } from "./core/cewg/CewgLightCuller";
export { CewgResourceBinder } from "./core/cewg/CewgResourceBinder";
export * as CewgCarbonData from "./core/cewg/CewgCarbonData";

