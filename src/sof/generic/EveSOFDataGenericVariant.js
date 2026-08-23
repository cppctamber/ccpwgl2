import { meta } from "utils";


@meta.define("EveSOFDataGenericVariant", true)
export class EveSOFDataGenericVariant extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataHullArea")
    hullArea = null;

    @meta.boolean
    isTransparent = false;

}
