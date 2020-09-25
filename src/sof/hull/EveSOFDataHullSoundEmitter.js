import { meta, vec3 } from "global";


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
