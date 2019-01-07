import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullArea
 *
 * @parameter {Number} areaType                        -
 * @parameter {Number} blockedMaterials                -
 * @parameter {Number} count                           -
 * @parameter {Number} index                           -
 * @parameter {Array.<EveSOFDataParameter>} parameters -
 * @parameter {String} shader                          -
 * @parameter {Array.<EveSOFDataTexture>} textures     -
 */
export default class EveSOFDataHullArea extends Tw2StagingClass
{

    areaType = 0;
    blockedMaterials = 0;
    count = 0;
    index = 0;
    parameters = [];
    shader = "";
    textures = [];

}

Tw2StagingClass.define(EveSOFDataHullArea, Type =>
{
    return {
        type: "EveSOFDataHullArea",
        props: {
            areaType: Type.NUMBER,
            blockedMaterials: Type.NUMBER,
            count: Type.NUMBER,
            index: Type.NUMBER,
            parameters: [["EveSOFDataParameter"]],
            shader: Type.STRING,
            textures: [["EveSOFDataTexture"]]
        }
    };
});

