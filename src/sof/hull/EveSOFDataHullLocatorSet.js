import { meta } from "utils";


@meta.type("EveSOFDataHullLocatorSet")
export class EveSOFDataHullLocatorSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataTransform")
    locators = [];

}
