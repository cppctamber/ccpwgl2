import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.type("EveSOFDataHullHazeSetItem")
export class EveSOFDataHullHazeSetItem
{

    @meta.boolean
    boosterGainInfluence = false;

    @meta.uint
    colorType = 0;

    @meta.float
    hazeBrightness = 0;

    @meta.float
    hazeFalloff = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    sourceBrightness = 0;

    @meta.float
    sourceSize = 0;

}
