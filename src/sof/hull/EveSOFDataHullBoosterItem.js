import { mat4, meta, vec4 } from "global";


@meta.type("EveSOFDataHullBoosterItem", true)
export class EveSOFDataHullBoosterItem
{

    @meta.black.uint
    atlasIndex0 = 0;

    @meta.black.uint
    atlasIndex1 = 0;

    @meta.black.vector4
    functionality = vec4.create();

    @meta.black.boolean
    hasTrail = false;

    @meta.black.float
    @meta.todo("What should the default value be?")
    lightScale = 1;

    @meta.black.matrix4
    transform = mat4.create();

}
