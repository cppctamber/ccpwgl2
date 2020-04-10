import { meta } from "global";


@meta.type("EveSOFDataLogoSet", true)
export class EveSOFDataLogoSet
{

    @meta.black.objectOf("EveSOFDataLogo")
    Marking_01 = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Marking_02 = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Primary = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Secondary = null;

    @meta.black.objectOf("EveSOFDataLogo")
    Tertiary = null;


    /**
     * Gets a logo set by type
     * @param {Number} type
     * @returns {EveSOFDataLogo|null}
     */
    FindType(type)
    {
        const name = EveSOFDataLogoSet.Type[type];
        return name && this[name] ? this[name] : null;
    }

    /**
     * Checks if a logo type exists by type
     * @param {Number} type
     * @returns {boolean}
     */
    HasType(type)
    {
        return this.FindType(type) !== null;
    }

    /**
     * Assigns logo textures by type
     * @param {Number} type
     * @param {Object} [out={}]
     */
    AssignType(type, out={})
    {
        const logo = this.FindType(type);
        if (!logo) throw new Error("Invalid type: " + type);
        return logo.Assign(out);
    }

    /**
     * Usage index
     * @type {String[]}
     */
    static Type = [
        "Primary",
        "Secondary",
        "Tertiary",
        "Marking_01",
        "Marking_02"
    ]

}
