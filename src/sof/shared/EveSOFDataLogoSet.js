import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataLogoSet
 *
 * @property {EveSOFDataLogo} Marking_01
 * @property {EveSOFDataLogo} Marking_02
 * @property {EveSOFDataLogo} Primary
 * @property {EveSOFDataLogo} Secondary
 * @property {EveSOFDataLogo} Tertiary
 */
export class EveSOFDataLogoSet extends EveSOFBaseClass
{

    Marking_01 = null;
    Marking_02 = null;
    Primary = null;
    Secondary = null;
    Tertiary = null;

}

EveSOFDataLogoSet.define(r =>
{
    return {
        type: "EveSOFDataLogoSet",
        black: [
            ["Marking_01", r.object],
            ["Marking_02", r.object],
            ["Primary", r.object],
            ["Secondary", r.object],
            ["Tertiary", r.object]
        ]
    };
});