import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.ctor("EveSOFDataHullBanner")
export class EveSOFDataHullBanner
{

    @meta.string
    name = "";

    @meta.float
    angleX = 0;

    @meta.float
    angleY = 0;

    @meta.float
    angleZ = 0;

    @meta.uint
    boneIndex = -1;

    @meta.struct()
    lightOverride = null;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.uint
    usage = 0;

}
