import { meta } from "utils";


@meta.type("EveSOFDataHullLocatorSet")
export class EveSOFDataHullLocatorSet
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataTransform")
    locators = [];

}
