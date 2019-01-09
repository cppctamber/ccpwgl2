import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataGenericString
 *
 * @parameter {String} str -
 */
export default class EveSOFDataGenericString extends Tw2BaseClass
{

    str = "";

}

Tw2BaseClass.define(EveSOFDataGenericString, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericString",
        props: {
            str: Type.STRING
        }
    };
});

