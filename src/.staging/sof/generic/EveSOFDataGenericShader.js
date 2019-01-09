import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataGenericShader
 *
 * @parameter {Array.<EveSOFDataParameter>} defaultParameters -
 * @parameter {Array.<EveSOFDataTexture>} defaultTextures     -
 * @parameter {Boolean} doGenerateDepthArea                   -
 * @parameter {Array.<EveSOFDataGenericString>} parameters    -
 * @parameter {String} shader                                 -
 * @parameter {String} transparencyTextureName                -
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

