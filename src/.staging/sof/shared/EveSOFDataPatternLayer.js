import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataPatternLayer
 *
 * @parameter {Boolean} isTargetMtl1      -
 * @parameter {Boolean} isTargetMtl2      -
 * @parameter {Boolean} isTargetMtl3      -
 * @parameter {Boolean} isTargetMtl4      -
 * @parameter {Number} materialSource     -
 * @parameter {Number} projectionTypeU    -
 * @parameter {Number} projectionTypeV    -
 * @parameter {String} textureName        -
 * @parameter {String} textureResFilePath -
 */
export default class EveSOFDataPatternLayer extends Tw2StagingClass
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

Tw2StagingClass.define(EveSOFDataPatternLayer, Type =>
{
    return {
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

