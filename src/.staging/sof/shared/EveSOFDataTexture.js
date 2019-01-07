import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataTexture
 *
 * @parameter {String} resFilePath -
 */
export default class EveSOFDataTexture extends Tw2StagingClass
{

    resFilePath = "";

}

Tw2StagingClass.define(EveSOFDataTexture, Type =>
{
    return {
        type: "EveSOFDataTexture",
        props: {
            resFilePath: Type.PATH
        }
    };
});

