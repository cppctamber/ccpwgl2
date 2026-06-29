import { meta } from "utils";
import { vec3, quat } from "math";


@meta.type("EveSOFDataHullChildSetItem")
@meta.define({
    wgl: "EveSOFDataHullChildSetItem",
    ccp: true
})
export class EveSOFDataHullChildSetItem extends meta.Model
{

    @meta.string
    name = "";

    @meta.path
    redFilePath = "";

    @meta.vector3
    translation = vec3.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.quaternion
    rotation = quat.create();

    @meta.int32
    buildFilter = -1;

    @meta.int32
    lowestLodVisible = -1;

}
