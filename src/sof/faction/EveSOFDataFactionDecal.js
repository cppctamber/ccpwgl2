import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataFactionDecal
 *
 * @property {Number} groupIndex                      -
 * @property {Boolean} isVisible                      -
 * @property {Array.<EveSOFDataParameter>} parameters -
 * @property {String} shader                          -
 * @property {Array.<EveSOFDataTexture>} textures     -
 */
export class EveSOFDataFactionDecal extends Tw2BaseClass
{

    groupIndex = 0;
    isVisible = false;
    parameters = [];
    shader = "";
    textures = [];

}

Tw2BaseClass.define(EveSOFDataFactionDecal, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataFactionDecal",
        props: {
            groupIndex: Type.NUMBER,
            isVisible: Type.BOOLEAN,
            parameters: [["EveSOFDataParameter"]],
            shader: Type.STRING,
            textures: [["EveSOFDataTexture"]]
        }
    };
});

