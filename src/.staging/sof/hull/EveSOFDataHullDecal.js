import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullDecal
 *
 * @parameter {Number} boneIndex                       -
 * @parameter {Number} glowColorType                   -
 * @parameter {Number} groupIndex                      -
 * @parameter {TypedArray} indexBuffer                 -
 * @parameter {Number} meshIndex                       -
 * @parameter {Array.<EveSOFDataParameter>} parameters -
 * @parameter {vec3} position                          -
 * @parameter {quat} rotation                          -
 * @parameter {vec3} scaling                           -
 * @parameter {String} shader                          -
 * @parameter {Array.<EveSOFDataTexture>} textures     -
 * @parameter {Number} usage                           -
 */
export default class EveSOFDataHullDecal extends Tw2StagingClass
{

    boneIndex = 0;
    glowColorType = 0;
    groupIndex = 0;
    indexBuffer = [];
    meshIndex = 0;
    parameters = [];
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    shader = "";
    textures = [];
    usage = 0;

}

Tw2StagingClass.define(EveSOFDataHullDecal, Type =>
{
    return {
        type: "EveSOFDataHullDecal",
        props: {
            boneIndex: Type.NUMBER,
            glowColorType: Type.NUMBER,
            groupIndex: Type.NUMBER,
            indexBuffer: Type.TYPED,
            meshIndex: Type.NUMBER,
            parameters: [["EveSOFDataParameter"]],
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            shader: Type.STRING,
            textures: [["EveSOFDataTexture"]],
            usage: Type.NUMBER
        }
    };
});

