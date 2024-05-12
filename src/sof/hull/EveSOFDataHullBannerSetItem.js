import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.type("EveSOFDataHullBannerSetItem")
export class EveSOFDataHullBannerSetItem extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    angleX = 0;

    @meta.float
    angleY = 0;

    @meta.uint
    boneIndex = -1;

    @meta.struct()
    light = null;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.uint
    usage = -1;

    //@meta.string
    //visibilityGroup = "";

    @meta.boolean
    maintainAspectRatio = false;

    static Usage = {
        "ALLIANCE_LOGO": 0,
        "CORP_LOGO": 1,
        "CEO_PORTRAIT": 2,
        "VERTICAL_BANNER": 3,
        "HORIZONTAL_BANNER": 4,
        "TARGET_SYSTEM_ALLIANCE_LOGO": 5,
        "TARGET_SYSTEM_VERTICAL_BANNER": 6,
        "TARGET_SYSTEM_HORIZONTAL_BANNER": 7,
        "TARGET_SYSTEM_INFO_0": 8,
        "TARGET_SYSTEM_INFO_1": 9,
        "TARGET_SYSTEM_INFO_2": 10,
        "TARGET_SYSTEM_INFO_3": 11,
        "TARGET_SYSTEM_INFO_4": 12,
        "CURRENT_SYSTEM_ALLIANCE_LOGO": 13,
        "CURRENT_SYSTEM_VERTICAL_BANNER": 14,
        "CURRENT_SYSTEM_HORIZONTAL_BANNER": 15,
        "PUBLICITY_POSTER": 16,
        "PUBLICITY_PORTRAIT": 17,
        "RECRUITMENT_INFO_0": 18,
        "RECRUITMENT_INFO_1": 19,
        "RECRUITMENT_INFO_2": 20,
        "RECRUITMENT_INFO_3": 21,
        "RECRUITMENT_INFO_4": 22
    };

}
