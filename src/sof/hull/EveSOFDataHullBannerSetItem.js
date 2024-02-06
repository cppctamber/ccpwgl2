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

    @meta.boolean
    maintainAspectRatio = false;

    /**
     * Usage types
     * @type {Object<Number:String>}
     */
    static Usage = {
        0: "ALLIANCE_LOGO",
        1: "CORP_LOGO",
        2: "CEO_PORTRAIT",
        3: "VERTICAL_BANNER",
        4: "HORIZONTAL_BANNER",
        5: "TARGET_SYSTEM_ALLIANCE_LOGO",
        6: "TARGET_SYSTEM_VERTICAL_BANNER",
        7: "TARGET_SYSTEM_HORIZONTAL_BANNER",
        8: "TARGET_SYSTEM_INFO_0",
        9: "TARGET_SYSTEM_INFO_1",
        10: "TARGET_SYSTEM_INFO_2",
        11: "TARGET_SYSTEM_INFO_3",
        12: "TARGET_SYSTEM_INFO_4",
        13: "CURRENT_SYSTEM_ALLIANCE_LOGO",
        14: "CURRENT_SYSTEM_VERTICAL_BANNER",
        15: "CURRENT_SYSTEM_HORIZONTAL_BANNER",
        16: "PUBLICITY_POSTER",
        17: "PUBLICITY_PORTRAIT",
        18: "RECRUITMENT_INFO_0",
        19: "RECRUITMENT_INFO_1",
        20: "RECRUITMENT_INFO_2",
        21: "RECRUITMENT_INFO_3",
        22: "RECRUITMENT_INFO_4",
    }

}