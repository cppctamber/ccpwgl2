import { meta } from "utils";


@meta.define("EveSOFDataHullLocatorSet", true)
export class EveSOFDataHullLocatorSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataTransform")
    locators = [];

}
