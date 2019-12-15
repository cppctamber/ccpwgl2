import { meta } from "global";


@meta.type("EveSOFDataHullLocatorSet", true)
export class EveSOFDataHullLocatorSet
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataTransform")
    locators = [];

}
