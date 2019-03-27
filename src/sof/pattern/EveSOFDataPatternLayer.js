import {EveSOFBaseClass} from "../EveSOFBaseClass";

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
export class EveSOFDataPatternLayer extends EveSOFBaseClass
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

EveSOFDataPatternLayer.define(r =>
{
    return {
        type: "EveSOFDataPatternLayer",
        black: [
            ["isTargetMtl1", r.boolean],
            ["isTargetMtl2", r.boolean],
            ["isTargetMtl3", r.boolean],
            ["isTargetMtl4", r.boolean],
            ["materialSource", r.uint],
            ["projectionTypeU", r.uint],
            ["projectionTypeV", r.uint],
            ["textureName", r.string],
            ["textureResFilePath", r.path]
        ]
    };
});