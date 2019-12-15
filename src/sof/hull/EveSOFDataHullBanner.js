import { meta, quat, vec3 } from "global";


@meta.type("EveSOFDataHullBanner", true)
export class EveSOFDataHullBanner
{

    @meta.black.string
    name = "";

    @meta.black.float
    angleX = 0;

    @meta.black.float
    angleY = 0;

    @meta.black.float
    angleZ = 0;

    @meta.black.uint
    boneIndex = -1;

    @meta.black.object
    lightOverride = null;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.uint
    usage = 0;

}
