import { meta } from "utils";
import { vec3 } from "math";


@meta.ctor("EveSOFDataHullSoundEmitter")
export class EveSOFDataHullSoundEmitter
{

    @meta.string
    name = "";

    @meta.string
    prefix = "";

    @meta.vector3
    position = vec3.create();

}
