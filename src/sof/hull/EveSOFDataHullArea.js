import { meta } from "global";


@meta.ctor("EveSOFDataHullArea")
export class EveSOFDataHullArea
{

    @meta.string
    name = "";

    @meta.uint
    areaType = 0;

    @meta.uint
    blockedMaterials = 0;

    @meta.uint
    count = 1;

    @meta.uint
    index = 0;

    @meta.list("EveSOFDataParameter")
    parameters = [];

    @meta.string
    shader = "";

    @meta.list("EveSOFDataTexture")
    textures = [];

}
