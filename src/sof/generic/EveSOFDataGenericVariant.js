import { meta } from "utils";


@meta.type("EveSOFDataGenericVariant")
export class EveSOFDataGenericVariant
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataHullArea")
    hullArea = null;

    @meta.boolean
    isTransparent = false;

}
