import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataTexture
 *
 * @property {String} name        -
 * @property {String} resFilePath -
 */
export class EveSOFDataTexture extends EveSOFBaseClass
{

    name = "";
    resFilePath = "";

}

EveSOFDataTexture.define(r =>
{
    return {
        type: "EveSOFDataTexture",
        black: [
            ["name", r.string],
            ["resFilePath", r.path]
        ]
    };
});