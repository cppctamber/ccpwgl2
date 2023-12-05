import { meta } from "utils";
import { Tw2Error } from "core";
import { EveSOFDataLogo } from "./EveSOFDataLogo";


@meta.type("EveSOFDataLogoSet")
export class EveSOFDataLogoSet extends meta.Model
{

    @meta.struct("EveSOFDataLogo")
    Marking_01 = null;

    @meta.struct("EveSOFDataLogo")
    Marking_02 = null;

    @meta.struct("EveSOFDataLogo")
    Primary = null;

    @meta.struct("EveSOFDataLogo")
    Secondary = null;

    @meta.struct("EveSOFDataLogo")
    Tertiary = null;


    /**
     * Checks if a logo exists by type
     * @param {Number} type
     * @returns {boolean}
     */
    Has(type)
    {
        const name = EveSOFDataLogoSet.LogoType[type];

        if (name === undefined)
        {
            throw new ErrSOFLogoSetTypeUnknown({ type });
        }

        return !!this[name];
    }

    /**
     * Gets a logo by type
     * @param {Number} type
     * @returns {EveSOFDataLogo}
     */
    Get(type)
    {
        if (!this.Has(type))
        {
            throw new ErrSOFLogoSetTypeNotFound({ type });
        }

        return this[EveSOFDataLogoSet.LogoType[type]];
    }

    /**
     * Usage index
     * TODO: Figure out how to automate this list
     * @type {String[]}
     */
    static LogoType = [
        "Primary",
        "Secondary",
        "Tertiary",
        "Marking_01",
        "Marking_02",
    ];

    /**
     *
     * @param {EveSOFDataLogoSet} a
     * @param {EveSOFDataLogoSet} [b]
     * @param {EveSOFDataLogoSet} [out=new EveSOFDataLogoSet]
     * @returns {EveSOFDataLogoSet}
     */
    static combine(a, b, out)
    {
        out = out || new this();
        if (!a) return out;
        this.LogoType.forEach(type => out[type] = EveSOFDataLogo.combine(a[type], b ? b[type] : null, out[type]));
        return out;
    }

}


export class ErrSOFLogoSetTypeUnknown extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF logo set type unknown (%type%)");
        this.unknownType = true;
    }
}

export class ErrSOFLogoSetTypeNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF logo set type not found (%type%)");
    }
}
