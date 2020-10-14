import { Tw2Library } from "core/engine";
import { store } from "./engine";

const
    tw2 = new Tw2Library(store),
    resMan = tw2.resMan,
    device = tw2.device,
    logger = tw2.logger;

export { tw2, resMan, device, store, logger };
