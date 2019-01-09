import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataGenericDecalShader
 *
 * @parameter {Array.<EveSOFDataTexture>} defaultTextures      -
 * @parameter {Array.<EveSOFDataGenericString>} parameters     -
 * @parameter {Array.<EveSOFDataGenericString>} parentTextures -
 * @parameter {String} shader                                  -
 */
export default class EveSOFDataGenericDecalShader extends Tw2BaseClass
{

    defaultTextures = [];
    parameters = [];
    parentTextures = [];
    shader = "";

}

Tw2BaseClass.define(EveSOFDataGenericDecalShader, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericDecalShader",
        props: {
            defaultTextures: [["EveSOFDataTexture"]],
            parameters: [["EveSOFDataGenericString"]],
            parentTextures: [["EveSOFDataGenericString"]],
            shader: Type.STRING
        }
    };
});

