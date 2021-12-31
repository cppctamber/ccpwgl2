import { meta } from "utils";
import { vec3, quat } from "math";


@meta.type("EveSOFDataHullSoundEmitter")
export class EveSOFDataHullSoundEmitter extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    prefix = "";

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

}
