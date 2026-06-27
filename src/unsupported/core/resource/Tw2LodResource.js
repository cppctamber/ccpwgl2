import { meta, toArray } from "utils";


@meta.notImplemented
@meta.type("Tr2LodResource")
@meta.ccp.define("Tr2LodResource")
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
