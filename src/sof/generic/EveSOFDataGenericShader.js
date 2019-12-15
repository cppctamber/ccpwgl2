import { meta } from "global";


@meta.type("EveSOFDataGenericShader", true)
export class EveSOFDataGenericShader
{

    @meta.black.listOf("EveSOFDataParameter")
    defaultParameters = [];

    @meta.black.listOf("EveSOFDataTexture")
    defaultTextures = [];

    @meta.black.boolean
    doGenerateDepthArea = false;

    @meta.black.listOf("EveSOFDataGenericString")
    parameters = [];

    @meta.black.path
    shader = "";

    @meta.black.string
    transparencyTextureName = "";

}
