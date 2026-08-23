import { meta } from "utils";
import { Tr2GrannyTrack } from "./Tr2GrannyTrack";


@meta.notImplemented
@meta.define("Tr2GrannyEventTrack", true)
export class Tr2GrannyEventTrack extends Tr2GrannyTrack
{
    @meta.private
    @meta.struct()
    eventListener = null;

    previousTime = 0;

    previousIndex = -1;

    track = null;
}
