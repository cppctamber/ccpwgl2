import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2AudioStretchAuto", "Tr2AudioStretchAuto")
@meta.ccp.define("Tr2AudioStretchAuto")
export class Tr2AudioStretchAuto extends meta.Model
{

    @meta.struct()
    sourceEmitter = null;

    @meta.struct()
    destinationEmitter = null;

    @meta.struct()
    stretchEmitter = null;

    @meta.string
    outburstEvent = "";

}
