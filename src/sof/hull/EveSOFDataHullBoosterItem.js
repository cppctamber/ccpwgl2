import { meta } from "utils";
import { vec4, mat4 } from "math";


@meta.type("EveSOFDataHullBoosterItem")
export class EveSOFDataHullBoosterItem extends meta.Model
{

    @meta.uint
    atlasIndex0 = 0;

    @meta.uint
    atlasIndex1 = 0;

    @meta.vector4
    @meta.notImplemented
    functionality = vec4.create();

    @meta.boolean
    hasTrail = false;

    @meta.float
    @meta.todo("What should the default value be?")
    lightScale = 1;

    @meta.matrix4
    transform = mat4.create();

}
