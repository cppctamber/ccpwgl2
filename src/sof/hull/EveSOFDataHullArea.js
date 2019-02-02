import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullArea
 *
 * @property {Number} areaType                        -
 * @property {Number} blockedMaterials                -
 * @property {Number} count                           -
 * @property {Number} index                           -
 * @property {Array.<EveSOFDataParameter>} parameters -
 * @property {String} shader                          -
 * @property {Array.<EveSOFDataTexture>} textures     -
 */
export class EveSOFDataHullArea extends Tw2BaseClass
{

    areaType = 0;
    blockedMaterials = 0;
    count = 0;
    index = 0;
    parameters = [];
    shader = "";
    textures = [];

}

Tw2BaseClass.define(EveSOFDataHullArea, Type =>
{
    return {
        isStaging: true,
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

