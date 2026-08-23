import { meta } from "utils";


@meta.define({
    wgl: "EveSOFDataHullLocatorSet",
    ccp: true
})
export class EveSOFDataHullLocatorSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataTransform")
    locators = [];

}
