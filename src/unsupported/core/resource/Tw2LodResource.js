import { meta, toArray } from "utils";


@meta.notImplemented
@meta.define("Tr2LodResource", true)
export class Tr2LodResource extends meta.Model
{

    @meta.string
    name = "";

    @meta.path
    highDetailResPath = "";

    @meta.path
    lowDetailResPath = "";

    @meta.path
    mediumDetailResPath = "";

    @meta.path
    ultraDetailResPath = "";


}
