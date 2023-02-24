import { meta } from "utils";
import{ vec3 } from "math";


@meta.type("EveSOFDataHullExtensionPlacement")
export class EveSOFDataHullExtensionPlacement extends meta.Model
{

    @meta.struct()
    descriptor = null;

    @meta.struct()
    distribution = null;

    @meta.list()
    distributionConditions = [];

    @meta.boolean
    isInstanced = false;

    @meta.string
    locatorSetName = "";

    @meta.boolean
    matchHull = true;

    @meta.boolean
    matchFaction = true;

    @meta.string
    name = "";

    @meta.vector3
    offset = vec3.create();

    @meta.struct()
    parentDescriptor = null;

    @meta.string
    resPathDefaultCorp = "";

}
