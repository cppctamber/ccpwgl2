import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataGenericDecalShader
 *
 * @parameter {Array.<EveSOFDataTexture>} defaultTextures      -
 * @parameter {Array.<EveSOFDataGenericString>} parameters     -
 * @parameter {Array.<EveSOFDataGenericString>} parentTextures -
 * @parameter {String} shader                                  -
 */
export default class EveSOFDataGenericDecalShader extends Tw2StagingClass
{

    defaultTextures = [];
    parameters = [];
    parentTextures = [];
    shader = "";

}

Tw2StagingClass.define(EveSOFDataGenericDecalShader, Type =>
{
    return {
        type: "EveSOFDataGenericDecalShader",
        props: {
            defaultTextures: [["EveSOFDataTexture"]],
            parameters: [["EveSOFDataGenericString"]],
            parentTextures: [["EveSOFDataGenericString"]],
            shader: Type.STRING
        }
    };
});

