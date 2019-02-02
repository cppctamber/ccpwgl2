import {quat, vec3} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullDecal
 *
 * @property {Number} boneIndex                       -
 * @property {Number} glowColorType                   -
 * @property {Number} groupIndex                      -
 * @property {TypedArray} indexBuffer                 -
 * @property {Number} meshIndex                       -
 * @property {Array.<EveSOFDataParameter>} parameters -
 * @property {vec3} position                          -
 * @property {quat} rotation                          -
 * @property {vec3} scaling                           -
 * @property {String} shader                          -
 * @property {Array.<EveSOFDataTexture>} textures     -
 * @property {Number} usage                           -
 */
export class EveSOFDataHullDecal extends Tw2BaseClass
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

Tw2BaseClass.define(EveSOFDataHullDecal, Type =>
{
    return {
        isStaging: true,
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

