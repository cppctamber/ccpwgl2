import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataMaterial
 *
 * @property {String} name                            -
 * @property {Array.<EveSOFDataParameter>} parameters -
 */
export class EveSOFDataMaterial extends EveSOFBaseClass
{

    name = "";
    parameters = [];

}

EveSOFDataMaterial.define(r =>
{
    return {
        type: "EveSOFDataMaterial",
        black: [
            ["name", r.string],
            ["parameters", r.array]
        ]
    };
});