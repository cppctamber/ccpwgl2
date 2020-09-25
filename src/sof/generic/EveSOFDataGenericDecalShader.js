import { meta } from "global";


@meta.ctor("EveSOFDataGenericDecalShader", true)
export class EveSOFDataGenericDecalShader
{

    @meta.list("EveSOFDataTexture")
    defaultTextures = [];

    @meta.list("EveSOFDataGenericString")
    parameters = [];

    @meta.list("EveSOFDataGenericString")
    parentTextures = [];

    @meta.string
    shader = "";

}
