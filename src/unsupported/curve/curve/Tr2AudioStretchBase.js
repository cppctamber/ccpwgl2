import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2AudioStretchBase", "Tr2AudioStretchBase")
@meta.ccp.define("Tr2AudioStretchBase")
export class Tr2AudioStretchBase extends meta.Model
{

    @meta.notOwned
    @meta.struct()
    sourceEmitter = null;

    @meta.notOwned
    @meta.struct()
    destinationEmitter = null;

    @meta.struct()
    stretchEmitter = null;

    @meta.string
    outburstEvent = "";

    @meta.string
    impactEvent = "";

    @meta.string
    stretchEvent = "";

}
