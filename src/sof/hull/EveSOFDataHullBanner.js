import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.type("EveSOFDataHullBanner")
@meta.define({
    wgl: "EveSOFDataHullBanner",
    ccp: true
})
export class EveSOFDataHullBanner extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    angleX = 0;

    @meta.float
    angleY = 0;

    @meta.float
    angleZ = 0;

    @meta.int32
    boneIndex = -1;

    @meta.struct()
    lightOverride = null;

    @meta.boolean
    maintainAspectRatio = false;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.uint
    usage = 0;

    @meta.string
    visibilityGroup = "";

}
