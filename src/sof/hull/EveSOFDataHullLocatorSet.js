import { meta } from "global";


@meta.ctor("EveSOFDataHullLocatorSet")
export class EveSOFDataHullLocatorSet
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataTransform")
    locators = [];

}
