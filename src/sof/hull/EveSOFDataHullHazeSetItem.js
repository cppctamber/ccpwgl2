import { meta, quat, vec3 } from "global";


@meta.type("EveSOFDataHullHazeSetItem", true)
export class EveSOFDataHullHazeSetItem
{

    @meta.black.boolean
    boosterGainInfluence = false;

    @meta.black.uint
    colorType = 0;

    @meta.black.float
    hazeBrightness = 0;

    @meta.black.float
    hazeFalloff = 0;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.float
    sourceBrightness = 0;

    @meta.black.float
    sourceSize = 0;

}
