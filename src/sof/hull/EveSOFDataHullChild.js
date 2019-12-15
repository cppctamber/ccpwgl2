import { meta, quat, vec3 } from "global";


@meta.type("EveSOFDataHullChild", true)
export class EveSOFDataHullChild
{

    @meta.black.string
    name = "";

    @meta.black.uint
    groupIndex = -1;

    @meta.black.uint
    id = 0;

    @meta.black.uint
    lowestLodVisible = 0;

    @meta.black.path
    redFilePath = "";

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.vector3
    translation = vec3.create();

}
