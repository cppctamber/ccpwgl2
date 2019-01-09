import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataFactionDecal
 *
 * @parameter {Number} groupIndex                      -
 * @parameter {Boolean} isVisible                      -
 * @parameter {Array.<EveSOFDataParameter>} parameters -
 * @parameter {String} shader                          -
 * @parameter {Array.<EveSOFDataTexture>} textures     -
 */
export default class EveSOFDataFactionDecal extends Tw2BaseClass
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

