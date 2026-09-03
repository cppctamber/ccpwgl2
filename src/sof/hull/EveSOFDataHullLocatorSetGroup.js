import { meta } from "utils";


@meta.define("EveSOFDataHullLocatorSetGroup", true)
export class EveSOFDataHullLocatorSetGroup extends meta.Model
{

    @meta.string
    name = "";

    @meta.list()
    locatorSets = [];

}
