import { meta } from "global";


@meta.type("EveSOFDataHullArea", true)
export class EveSOFDataHullArea
{

    @meta.black.string
    name = "";

    @meta.black.uint
    areaType = 0;

    @meta.black.uint
    blockedMaterials = 0;

    @meta.black.uint
    count = 0;

    @meta.black.uint
    index = 0;

    @meta.black.listOf("EveSOFDataParameter")
    parameters = [];

    @meta.black.string
    shader = "";

    @meta.black.listOf("EveSOFDataTexture")
    textures = [];

}
