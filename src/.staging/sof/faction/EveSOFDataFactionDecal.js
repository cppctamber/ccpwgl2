import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataFactionDecal
 *
 * @parameter {Number} groupIndex                      -
 * @parameter {Boolean} isVisible                      -
 * @parameter {Array.<EveSOFDataParameter>} parameters -
 * @parameter {String} shader                          -
 * @parameter {Array.<EveSOFDataTexture>} textures     -
 */
export default class EveSOFDataFactionDecal extends Tw2StagingClass
{

    groupIndex = 0;
    isVisible = false;
    parameters = [];
    shader = "";
    textures = [];

}

Tw2StagingClass.define(EveSOFDataFactionDecal, Type =>
{
    return {
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

