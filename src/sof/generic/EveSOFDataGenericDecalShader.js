import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataGenericDecalShader
 *
 * @property {Array.<EveSOFDataTexture>} defaultTextures      -
 * @property {Array.<EveSOFDataGenericString>} parameters     -
 * @property {Array.<EveSOFDataGenericString>} parentTextures -
 * @property {String} shader                                  -
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

