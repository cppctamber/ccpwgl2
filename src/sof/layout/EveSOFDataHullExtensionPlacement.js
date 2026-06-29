import { meta } from "utils";
import { vec3 } from "math";


@meta.type("EveSOFDataHullExtensionPlacement")
@meta.define({
    wgl: "EveSOFDataHullExtensionPlacement",
    ccp: true
})
export class EveSOFDataHullExtensionPlacement extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    enabled = true;

    @meta.boolean
    extendsBoundingSphere = true;

    @meta.boolean
    extendsBoundingEllipsoid = false;

    @meta.boolean
    extendsShieldEllipsoid = true;

    @meta.string
    locatorSetName = "";

    @meta.vector3
    offset = vec3.create();

    @meta.boolean
    isInstanced = true;

    @meta.boolean
    isShared = false;

    @meta.struct("EveSOFDNADescriptor")
    descriptor = null;

    @meta.struct("EveSOFDataHullExtensionPlacementDistributionPlacement")
    distribution = null;

    @meta.list() // "EveSOFDataHulLExtensionPlacementDistribution"
    distributionConditions = [];

    /*

    @meta.boolean
    matchHull = true;

    @meta.boolean
    matchFaction = true;

    @meta.struct()
    parentDescriptor = null;

    @meta.string
    resPathDefaultCorp = "";

     */

}
