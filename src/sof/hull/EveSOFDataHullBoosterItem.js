import { mat4, meta, vec4 } from "global";


@meta.ctor("EveSOFDataHullBoosterItem")
export class EveSOFDataHullBoosterItem
{

    @meta.uint
    atlasIndex0 = 0;

    @meta.uint
    atlasIndex1 = 0;

    @meta.vector4
    functionality = vec4.create();

    @meta.boolean
    hasTrail = false;

    @meta.float
    @meta.todo("What should the default value be?")
    lightScale = 1;

    @meta.matrix4
    transform = mat4.create();

}
