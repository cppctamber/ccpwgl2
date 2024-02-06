import { meta } from "utils";
import { vec3, quat } from "math";


@meta.type("EveSOFDataHullChildSetItem")
export class EveSOFDataHullChildSetItem extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    redFilePath = "";

    @meta.vector3
    translation = vec3.create();

    @meta.vector3
    scaling = vec3.fromValues(1,1,1);

    @meta.quaternion
    rotation = quat.create()

    @meta.uint
    buildFilter = -1;

}