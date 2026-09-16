import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.define("EveSOFDataHullChild", true)
export class EveSOFDataHullChild extends meta.Model
{

    @meta.string
    name = "";

    @meta.int32
    buildFilter = -1;

    @meta.int32
    groupIndex = -1;

    // Carbon `m_id( -1 )` (`EveSOFData.cpp:506`): -1 means the child binds to no hull
    // animation, and `SetupChildrenAndAnimations` tests `id != -1` before binding it
    @meta.int32
    id = -1;

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
