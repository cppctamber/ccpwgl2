import { Tw2Library } from "core/engine";
import { store } from "./engine";

const
    tw2 = new Tw2Library(store),
    resMan = tw2.resMan,
    device = tw2.device;

export { tw2, resMan, device };
