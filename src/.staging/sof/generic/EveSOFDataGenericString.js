import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataGenericString
 *
 * @parameter {String} str -
 */
export default class EveSOFDataGenericString extends Tw2StagingClass
{

    str = "";

}

Tw2StagingClass.define(EveSOFDataGenericString, Type =>
{
    return {
        type: "EveSOFDataGenericString",
        props: {
            str: Type.STRING
        }
    };
});

