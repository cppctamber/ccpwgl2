import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataGenericShader
 *
 * @property {Array.<EveSOFDataParameter>} defaultParameters -
 * @property {Array.<EveSOFDataTexture>} defaultTextures     -
 * @property {Boolean} doGenerateDepthArea                   -
 * @property {Array.<EveSOFDataGenericString>} parameters    -
 * @property {String} shader                                 -
 * @property {Array.<EveSOFData
 * @property {String} transparencyTextureName                -
 */
export class EveSOFDataGenericShader extends EveSOFBaseClass
{

    defaultParameters = [];
    defaultTextures = [];
    doGenerateDepthArea = false;
    parameters = [];
    shader = "";
    transparencyTextureName = "";

}

EveSOFDataGenericShader.define(r =>
{
    return {
        type: "EveSOFDataGenericShader",
        black: [
            ["defaultParameters", r.array],
            ["defaultTextures", r.array],
            ["doGenerateDepthArea", r.boolean],
            ["parameters", r.array],
            ["shader", r.string],
            ["transparencyTextureName", r.string],
        ]
    };
});