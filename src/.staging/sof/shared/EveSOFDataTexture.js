import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataTexture
 *
 * @parameter {String} resFilePath -
 */
export default class EveSOFDataTexture extends Tw2BaseClass
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

