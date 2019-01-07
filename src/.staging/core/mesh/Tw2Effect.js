import {Tw2StagingClass} from "../../class";

/**
 * Tw2Effect
 * @ccp Tr2Effect
 *
 * @parameter {Plain} constParameters        -
 * @parameter {String} effectFilePath        -
 * @parameter {Array} options                -
 * @parameter {Array.<Parameter>} parameters -
 * @parameter {Array.<Parameter>} resources  -
 * @parameter {Array} samplerOverrides       -
 */
export default class Tw2Effect extends Tw2StagingClass
{

    constParameters = {};
    effectFilePath = "";
    options = [];
    parameters = [];
    resources = [];
    samplerOverrides = [];

}

Tw2StagingClass.define(Tw2Effect, Type =>
{
    return {
        type: "Tw2Effect",
        props: {
            constParameters: Type.PLAIN,
            effectFilePath: Type.PATH,
            options: Type.ARRAY,
            parameters: [["Tw2FloatParameter", "Tw2Matrix4Parameter", "Tw2Vector4Parameter", "Tw2VariableParameter"]],
            resources: [["Tw2Texture2dLodParameter", "Tw2TextureParameter"]],
            samplerOverrides: Type.ARRAY
        }
    };
});

