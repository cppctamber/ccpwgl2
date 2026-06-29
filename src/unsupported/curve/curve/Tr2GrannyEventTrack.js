import { meta } from "utils";
import { Tr2GrannyTrack } from "./Tr2GrannyTrack";


@meta.notImplemented
@meta.type("Tr2GrannyEventTrack")
@meta.ccp.define("Tr2GrannyEventTrack")
export class Tr2GrannyEventTrack extends Tr2GrannyTrack
{
    @meta.private
    @meta.struct()
    eventListener = null;

    previousTime = 0;

    previousIndex = -1;

    track = null;
}
