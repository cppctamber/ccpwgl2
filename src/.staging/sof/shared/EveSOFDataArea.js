import {Tw2StagingClass} from "../../class";

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
export default class EveSOFDataArea extends Tw2StagingClass
{

    Darkhull = null;
    Glass = null;
    Primary = null;
    Reactor = null;
    Rock = null;
    Sails = null;

}

Tw2StagingClass.define(EveSOFDataArea, Type =>
{
    return {
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

