import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataArea
 *
 * @parameter {EveSOFDataAreaMaterial} Darkhull -
 * @parameter {EveSOFDataAreaMaterial} Glass    -
 * @parameter {EveSOFDataAreaMaterial} Primary  -
 * @parameter {EveSOFDataAreaMaterial} Reactor  -
 * @parameter {EveSOFDataAreaMaterial} Rock     -
 * @parameter {EveSOFDataAreaMaterial} Sails    -
 */
export default class EveSOFDataArea extends Tw2BaseClass
{

    Darkhull = null;
    Glass = null;
    Primary = null;
    Reactor = null;
    Rock = null;
    Sails = null;

}

Tw2BaseClass.define(EveSOFDataArea, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataArea",
        props: {
            Darkhull: ["EveSOFDataAreaMaterial"],
            Glass: ["EveSOFDataAreaMaterial"],
            Primary: ["EveSOFDataAreaMaterial"],
            Reactor: ["EveSOFDataAreaMaterial"],
            Rock: ["EveSOFDataAreaMaterial"],
            Sails: ["EveSOFDataAreaMaterial"]
        }
    };
});

