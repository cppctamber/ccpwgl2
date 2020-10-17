import { meta } from "utils";
import { mat4 } from "math";


@meta.ctor("EveSOFDataHullLocator")
export class EveSOFDataHullLocator
{

    @meta.string
    name = "";

    @meta.matrix4
    transform = mat4.create();

}
