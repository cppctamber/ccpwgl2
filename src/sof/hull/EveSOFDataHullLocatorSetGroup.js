import { meta } from "utils";


@meta.define({
    wgl: "EveSOFDataHullLocatorSetGroup",
    ccp: true
})
export class EveSOFDataHullLocatorSetGroup extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullLocatorSet")
    locatorSets = [];

}
