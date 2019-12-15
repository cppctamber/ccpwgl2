import { meta } from "global";


@meta.type("EveSOFDataGenericVariant", true)
export class EveSOFDataGenericVariant
{

    @meta.black.string
    name = "";

    @meta.black.objectOf("EveSOFDataHullArea")
    hullArea = null;

    @meta.black.boolean
    isTransparent = false;

}
