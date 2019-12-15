import { meta } from "global";


@meta.type("EveSOFDataGenericDecalShader", true)
export class EveSOFDataGenericDecalShader
{

    @meta.black.listOf("EveSOFDataTexture")
    defaultTextures = [];

    @meta.black.listOf("EveSOFDataGenericString")
    parameters = [];

    @meta.black.listOf("EveSOFDataGenericString")
    parentTextures = [];

    @meta.black.string
    shader = "";

}
