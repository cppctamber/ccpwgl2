import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataAreaMaterial
 *
 * @parameter {Number} colorType -
 * @parameter {String} material1 -
 * @parameter {String} material2 -
 * @parameter {String} material3 -
 * @parameter {String} material4 -
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

