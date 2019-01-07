import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataMaterial
 *
 * @parameter {Array.<EveSOFDataParameter>} parameters -
 */
export default class EveSOFDataMaterial extends Tw2StagingClass
{

    parameters = [];

}

Tw2StagingClass.define(EveSOFDataMaterial, Type =>
{
    return {
        type: "EveSOFDataMaterial",
        props: {
            parameters: [["EveSOFDataParameter"]]
        }
    };
});

