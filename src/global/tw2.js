import { Tw2Library } from "core/engine/Tw2Library";
import { Tw2Store } from "core/engine/Tw2Store";

export const store = new Tw2Store(Tw2Library);

const
    tw2 = new Tw2Library(store),
    resMan = tw2.resMan,
    device = tw2.device,
    logger = tw2.logger;

export { tw2, resMan, device, logger };
