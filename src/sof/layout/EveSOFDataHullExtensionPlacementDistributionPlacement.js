import { meta } from "utils";
import { vec3 } from "math";

@meta.type("EveSOFDataHullExtensionPlacementDistributionPlacement")
export class EveSOFDataHullExtensionPlacementDistributionPlacement extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    centerBias = 0;

    @meta.float
    completeness = 0;

    @meta.list()
    distributionConditions = [];

    @meta.vector3
    placementBias = vec3.create();

    @meta.vector3
    randomScaleMin = vec3.create();

    @meta.vector3
    randomScaleMax = vec3.create();

}