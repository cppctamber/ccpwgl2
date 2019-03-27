import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataLogo
 *
 * @parameter {Array<EveSOFDataTexture>} textures
 */
export class EveSOFDataLogo extends EveSOFBaseClass
{

    textures = [];

}

EveSOFDataLogo.define(r =>
{
    return {
        type: "EveSOFDataLogo",
        black: [
            ["textures", r.array]
        ]
    };
});