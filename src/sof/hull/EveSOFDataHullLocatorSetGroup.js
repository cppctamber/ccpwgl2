import { meta } from "utils";


@meta.type("EveSOFDataHullLocatorSetGroup")
export class EveSOFDataHullLocatorSetGroup extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullLocatorSet")
    locatorSets = [];

}
