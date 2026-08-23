import { meta } from "utils";

@meta.define({
    wgl: "EveSOFDataMultiHullDecalIndexBuffers",
    ccp: true
})
export class EveSOFDataMultiHullDecalIndexBuffers extends meta.Model
{

    @meta.path
    combinedGeometryResPath = "";

    @meta.list()
    indexBuffers = [];

}
