import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataAreaMaterial
 *
 * @property {Number} colorType -
 * @property {String} material1 -
 * @property {String} material2 -
 * @property {String} material3 -
 * @property {String} material4 -
 */
export default class EveSOFDataAreaMaterial extends Tw2BaseClass
{

    colorType = 0;
    material1 = "";
    material2 = "";
    material3 = "";
    material4 = "";

}

Tw2BaseClass.define(EveSOFDataAreaMaterial, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataAreaMaterial",
        props: {
            colorType: Type.NUMBER,
            material1: Type.STRING,
            material2: Type.STRING,
            material3: Type.STRING,
            material4: Type.STRING
        }
    };
});

