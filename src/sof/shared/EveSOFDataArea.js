import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataArea
 *
 * @property {EveSOFDataAreaMaterial} Darkhull -
 * @property {EveSOFDataAreaMaterial} Glass    -
 * @property {EveSOFDataAreaMaterial} Primary  -
 * @property {EveSOFDataAreaMaterial} Reactor  -
 * @property {EveSOFDataAreaMaterial} Rock     -
 * @property {EveSOFDataAreaMaterial} Sails    -
 */
export class EveSOFDataArea extends Tw2BaseClass
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

