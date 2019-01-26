import {Tw2BaseClass} from "../global/index";

/**
 * Tr2Effect
 *
 * @property {Plain} constParameters        -
 * @property {String} effectFilePath        -
 * @property {Array} options                -
 * @property {Array.<Parameter>} parameters -
 * @property {Array.<Parameter>} resources  -
 * @property {Array} samplerOverrides       -
 */
export default class Tr2Effect extends Tw2BaseClass
{

    constParameters = {};
    effectFilePath = "";
    options = [];
    parameters = [];
    resources = [];
    samplerOverrides = [];

}

Tw2BaseClass.define(Tr2Effect, Type =>
{
    return {
        isStaging: true,
        type: "Tr2Effect",
        props: {
            constParameters: Type.PLAIN,
            effectFilePath: Type.PATH,
            options: Type.ARRAY,
            parameters: [["Tr2FloatParameter", "Tr2Matrix4Parameter", "Tr2Vector4Parameter", "TriVariableParameter"]],
            resources: [["Tr2Texture2dLodParameter", "TriTextureParameter"]],
            samplerOverrides: Type.ARRAY
        }
    };
});

