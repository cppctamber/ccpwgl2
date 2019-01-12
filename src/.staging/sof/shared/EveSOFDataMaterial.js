import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataMaterial
 *
 * @property {Array.<EveSOFDataParameter>} parameters -
 */
export default class EveSOFDataMaterial extends Tw2BaseClass
{

    parameters = [];

}

Tw2BaseClass.define(EveSOFDataMaterial, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataMaterial",
        props: {
            parameters: [["EveSOFDataParameter"]]
        }
    };
});

