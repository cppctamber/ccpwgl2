import { meta } from "utils";
import { Tr2GrannyTrack } from "./Tr2GrannyTrack";


@meta.notImplemented
@meta.type("Tr2GrannyVectorTrack")
@meta.ccp.define("Tr2GrannyVectorTrack")
export class Tr2GrannyVectorTrack extends Tr2GrannyTrack
{
    @meta.private
    @meta.float
    value = 0;

    valueCurve = null;
}
