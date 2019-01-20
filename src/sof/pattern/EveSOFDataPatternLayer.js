import {Tw2BaseClass} from "../../global/index";

/**
 * EveSOFDataPatternLayer
 *
 * @property {Boolean} isTargetMtl1      -
 * @property {Boolean} isTargetMtl2      -
 * @property {Boolean} isTargetMtl3      -
 * @property {Boolean} isTargetMtl4      -
 * @property {Number} materialSource     -
 * @property {Number} projectionTypeU    -
 * @property {Number} projectionTypeV    -
 * @property {String} textureName        -
 * @property {String} textureResFilePath -
 */
export default class EveSOFDataPatternLayer extends Tw2BaseClass
{

    isTargetMtl1 = false;
    isTargetMtl2 = false;
    isTargetMtl3 = false;
    isTargetMtl4 = false;
    materialSource = 0;
    projectionTypeU = 0;
    projectionTypeV = 0;
    textureName = "";
    textureResFilePath = "";

}

Tw2BaseClass.define(EveSOFDataPatternLayer, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataPatternLayer",
        props: {
            isTargetMtl1: Type.BOOLEAN,
            isTargetMtl2: Type.BOOLEAN,
            isTargetMtl3: Type.BOOLEAN,
            isTargetMtl4: Type.BOOLEAN,
            materialSource: Type.NUMBER,
            projectionTypeU: Type.NUMBER,
            projectionTypeV: Type.NUMBER,
            textureName: Type.STRING,
            textureResFilePath: Type.PATH
        }
    };
});

