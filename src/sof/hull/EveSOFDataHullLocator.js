import { meta, mat4 } from "global";


@meta.ctor("EveSOFDataHullLocator")
export class EveSOFDataHullLocator
{

    @meta.string
    name = "";

    @meta.matrix4
    transform = mat4.create();

}
