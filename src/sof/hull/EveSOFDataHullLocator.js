import { meta } from "utils";
import { mat4 } from "math";


@meta.define("EveSOFDataHullLocator", true)
export class EveSOFDataHullLocator extends meta.Model
{

    @meta.string
    name = "";

    @meta.matrix4
    transform = mat4.create();

}
