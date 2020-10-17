import { meta } from "utils";


@meta.ctor("EveSOFDataGenericVariant", true)
export class EveSOFDataGenericVariant
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataHullArea")
    hullArea = null;

    @meta.boolean
    isTransparent = false;

}
