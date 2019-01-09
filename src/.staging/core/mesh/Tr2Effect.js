import {Tw2BaseClass} from "../../class";

/**
 * Tr2Effect
 *
 * @parameter {Plain} constParameters        -
 * @parameter {String} effectFilePath        -
 * @parameter {Array} options                -
 * @parameter {Array.<Parameter>} parameters -
 * @parameter {Array.<Parameter>} resources  -
 * @parameter {Array} samplerOverrides       -
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

