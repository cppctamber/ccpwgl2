import { meta } from "utils";

@meta.type("EveSOFDataMultiHullDecalIndexBuffers")
export class EveSOFDataMultiHullDecalIndexBuffers extends meta.Model
{

    @meta.path
    combinedGeometryResPath = "";

    @meta.list()
    indexBuffers = [];

}