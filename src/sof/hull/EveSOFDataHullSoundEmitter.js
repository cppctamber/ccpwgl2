import { meta, vec3 } from "global";


@meta.type("EveSOFDataHullSoundEmitter", true)
export class EveSOFDataHullSoundEmitter
{

    @meta.black.string
    name = "";

    @meta.black.string
    prefix = "";

    @meta.black.vector3
    position = vec3.create();
}
