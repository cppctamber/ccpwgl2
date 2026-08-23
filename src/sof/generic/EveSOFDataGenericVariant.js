import { meta } from "utils";


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
