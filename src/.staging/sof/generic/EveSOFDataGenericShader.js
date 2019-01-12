import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataGenericShader
 *
 * @property {Array.<EveSOFDataParameter>} defaultParameters -
 * @property {Array.<EveSOFDataTexture>} defaultTextures     -
 * @property {Boolean} doGenerateDepthArea                   -
 * @property {Array.<EveSOFDataGenericString>} parameters    -
 * @property {String} shader                                 -
 * @property {String} transparencyTextureName                -
 */
export default class EveSOFDataGenericShader extends Tw2BaseClass
{

    defaultParameters = [];
    defaultTextures = [];
    doGenerateDepthArea = false;
    parameters = [];
    shader = "";
    transparencyTextureName = "";

}

Tw2BaseClass.define(EveSOFDataGenericShader, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericShader",
        props: {
            defaultParameters: [["EveSOFDataParameter"]],
            defaultTextures: [["EveSOFDataTexture"]],
            doGenerateDepthArea: Type.BOOLEAN,
            parameters: [["EveSOFDataGenericString"]],
            shader: Type.STRING,
            transparencyTextureName: Type.STRING
        }
    };
});

