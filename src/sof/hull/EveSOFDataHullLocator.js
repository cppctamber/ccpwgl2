import { meta, mat4 } from "global";


@meta.type("EveSOFDataHullLocator", true)
export class EveSOFDataHullLocator
{

    @meta.black.string
    name = "";

    @meta.black.matrix4
    transform = mat4.create();

}
