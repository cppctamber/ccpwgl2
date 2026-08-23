import { meta } from "utils";

@meta.define("EveSOFDataMultiHullDecalIndexBuffers", true)
export class EveSOFDataMultiHullDecalIndexBuffers extends meta.Model
{

    @meta.path
    combinedGeometryResPath = "";

    @meta.list()
    indexBuffers = [];

}
