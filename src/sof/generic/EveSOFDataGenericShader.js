import { meta } from "global";


@meta.ctor("EveSOFDataGenericShader")
export class EveSOFDataGenericShader
{

    @meta.list("EveSOFDataParameter")
    defaultParameters = [];

    @meta.list("EveSOFDataTexture")
    defaultTextures = [];

    @meta.notImplemented
    @meta.boolean
    doGenerateDepthArea = false;

    @meta.list("EveSOFDataGenericString")
    parameters = [];

    @meta.path
    shader = "";

    @meta.notImplemented
    @meta.string
    transparencyTextureName = "";


    /**
     * Pattern mask maps
     * @type {string[]}
     */
    static PatternMaskMaps = [ "PatternMask1Map", "PatternMask2Map" ];

}
