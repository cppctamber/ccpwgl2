/**
 * EveSOFDataArea
 *
 * @property {EveSOFDataAreaMaterial} Black     -
 * @property {EveSOFDataAreaMaterial} Blue      -
 * @property {EveSOFDataAreaMaterial} Booster   -
 * @property {EveSOFDataAreaMaterial} Cyan      -
 * @property {EveSOFDataAreaMaterial} Darkhull  -
 * @property {EveSOFDataAreaMaterial} Fire      -
 * @property {EveSOFDataAreaMaterial} Glass     -
 * @property {EveSOFDataAreaMaterial} Green     -
 * @property {EveSOFDataAreaMaterial} Hull      -
 * @property {EveSOFDataAreaMaterial} Killmark  -
 * @property {EveSOFDataAreaMaterial} Monument  -
 * @property {EveSOFDataAreaMaterial} Orange    -
 * @property {EveSOFDataAreaMaterial} Primary   -
 * @property {EveSOFDataAreaMaterial} Reactor   -
 * @property {EveSOFDataAreaMaterial} Red       -
 * @property {EveSOFDataAreaMaterial} Rock      -
 * @property {EveSOFDataAreaMaterial} Sails     -
 * @property {EveSOFDataAreaMaterial} Secondary -
 * @property {EveSOFDataAreaMaterial} Tertiary  -
 * @property {EveSOFDataAreaMaterial} White     -
 * @property {EveSOFDataAreaMaterial} Yellow    -
 */
export class EveSOFDataArea
{

    Black = null;
    Blue = null;
    Booster = null;
    Cyan = null;
    Darkhull = null;
    Fire = null;
    Glass = null;
    Green = null;
    Hull = null;
    Killmark = null;
    Monument = null;
    Orange = null;
    Primary = null;
    Reactor = null;
    Red = null;
    Rock = null;
    Sails = null;
    Secondary = null;
    Tertiary = null;
    White = null;
    Yellow = null;

    /**
     * Gets a data area by it's name
     * @param {String} name
     * @returns {EveSOFDataAreaMaterial|null}
     */
    Get(name)
    {
        if (name.indexOf("area_") === 0) name = name.substring(5);
        name = name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
        return name in this ? this[name] : null;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "Black", r.object ],
            [ "Blue", r.object ],
            [ "Booster", r.object ],
            [ "Cyan", r.object ],
            [ "Darkhull", r.object ],
            [ "Fire", r.object ],
            [ "Glass", r.object ],
            [ "Green", r.object ],
            [ "Hull", r.object ],
            [ "Killmark", r.object ],
            [ "Monument", r.object ],
            [ "Orange", r.object ],
            [ "Primary", r.object ],
            [ "Reactor", r.object ],
            [ "Red", r.object ],
            [ "Rock", r.object ],
            [ "Sails", r.object ],
            [ "Secondary", r.object ],
            [ "Tertiary", r.object ],
            [ "White", r.object ],
            [ "Yellow", r.object ]
        ];
    }
}
