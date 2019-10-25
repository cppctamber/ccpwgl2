import * as meta from "./decorators";
export { meta };

export * from "./class";
export * from "./engine/Tw2Constant";
export * from "./Tw2Library";
export * from "./math";

import { tw2 } from "./Tw2Library";

export const resMan = tw2.resMan;
export const device = tw2.device;
export const util = tw2.util;
