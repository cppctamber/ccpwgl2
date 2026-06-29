import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2GrannyTrack")
@meta.ccp.define("Tr2GrannyTrack")
export class Tr2GrannyTrack extends meta.Model
{
    @meta.path
    grannyResPath = "";

    @meta.private
    @meta.struct()
    grannyRes = null;

    @meta.string
    name = "";

    @meta.string
    group = "";

    @meta.private
    @meta.float
    duration = 0;

    @meta.boolean
    cycle = false;

    Initialize()
    {
        return true;
    }

    OnModified()
    {
        return true;
    }

    UpdateValue()
    {
    }

    GetLength()
    {
        return this.duration;
    }
}
