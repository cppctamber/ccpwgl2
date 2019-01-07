import {Tw2StagingClass} from "../../class";

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
export default class EveSOFDataGenericShader extends Tw2StagingClass
{

    defaultParameters = [];
    defaultTextures = [];
    doGenerateDepthArea = false;
    parameters = [];
    shader = "";
    transparencyTextureName = "";

}

Tw2StagingClass.define(EveSOFDataGenericShader, Type =>
{
    return {
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

