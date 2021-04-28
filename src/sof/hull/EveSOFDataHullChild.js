import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.type("EveSOFDataHullChild")
export class EveSOFDataHullChild extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    groupIndex = -1;

    @meta.uint
    id = 0;

    @meta.uint
    lowestLodVisible = 0;

    @meta.path
    redFilePath = "";

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    @meta.string
    visibilityGroup = "";

}
