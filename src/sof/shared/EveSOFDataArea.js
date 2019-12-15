import { meta } from "global";


@meta.type("EveSOFDataArea", true)
export class EveSOFDataArea
{

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Black = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Blue = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Booster = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Cyan = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Darkhull = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Fire = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Glass = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Green = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Hull = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Killmark = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Monument = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Orange = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Primary = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Reactor = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Red = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Rock = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Sails = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Secondary = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    Tertiary = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    White = null;

    @meta.black.objectOf("EveSOFDataAreaMaterial")
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

}
