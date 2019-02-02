import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataTexture
 *
 * @property {String} resFilePath -
 */
export class EveSOFDataTexture extends Tw2BaseClass
{

    resFilePath = "";

}

Tw2BaseClass.define(EveSOFDataTexture, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataTexture",
        props: {
            resFilePath: Type.PATH
        }
    };
});

