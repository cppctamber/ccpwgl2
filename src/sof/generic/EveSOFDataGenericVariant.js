import { meta } from "utils";


@meta.type("EveSOFDataGenericVariant")
@meta.define({
    wgl: "EveSOFDataGenericVariant",
    ccp: true
})
export class EveSOFDataGenericVariant extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataHullArea")
    hullArea = null;

    @meta.boolean
    isTransparent = false;

}
