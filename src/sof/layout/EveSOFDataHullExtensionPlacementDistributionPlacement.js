import { meta } from "utils";
import { vec3 } from "math";
import { quat } from "math/quat";

@meta.type("EveSOFDataHullExtensionPlacementDistributionPlacement")
@meta.define({
    wgl: "EveSOFDataHullExtensionPlacementDistributionPlacement",
    ccp: true
})
export class EveSOFDataHullExtensionPlacementDistributionPlacement extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    cap = 0;

    @meta.float
    centerBias = 0.0;

    @meta.float
    completeness = 1.0;

    @meta.struct("EveSOFDNADescriptor")
    descriptor = null;

    @meta.list()
    distributionConditions = [];

    @meta.boolean
    extendsBoundingSphere = false;

    @meta.boolean
    extendsBoundingEllipsoid = false;

    @meta.boolean
    extendsShieldEllipsoid = false;

    @meta.boolean
    occupyLocators = true;

    @meta.vector3
    placementBias = vec3.create();

    @meta.vector3
    randomScaleMin = vec3.fromValues(1, 1, 1);

    @meta.vector3
    randomScaleMax = vec3.fromValues(1, 1, 1);

    @meta.vector3
    randomRotationMaxSteps = vec3.create();

    @meta.quaternion
    randomRotationStepSizeYPR = quat.create();

    @meta.boolean
    uniformScale = true;

}
