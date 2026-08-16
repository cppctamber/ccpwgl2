import { meta } from "utils";
import { Tw2Error } from "core";
import { EveSOFDataLogo } from "./EveSOFDataLogo";


@meta.type("EveSOFDataLogoSet")
@meta.define({
    wgl: "EveSOFDataLogoSet",
    ccp: true
})
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

    @meta.struct("EveSOFDataLogo")
    Corporation = null;


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
     *
     * Order is the wire order, because these are not independent properties:
     * Carbon generates the whole set from one enum chooser
     * (`EveSOFDataLogoSetTypeChooser[TYPE_*]`) over a single `m_logos` array, so
     * a slot's position here IS its index in that array and anything that names
     * a logo numerically means this order.
     *
     * `Corporation` is APPENDED, never inserted, for exactly that reason: it is
     * a NetEase extension that Carbon's own source does not declare - the
     * generated schema for this class lists five slots and stops - and putting
     * it anywhere but last would renumber the five that CCP data already
     * references. A wrong index here does not fail, it decodes a plausible
     * wrong logo, which is worse than not reading it at all.
     *
     * The property itself was already declared above and unreachable: `Has`,
     * `Get` and `combine` all walk this list, so a corporation logo parsed and
     * was then silently dropped.
     *
     * TODO: Figure out how to automate this list
     * @type {String[]}
     */
    static LogoType = [
        "Primary",
        "Secondary",
        "Tertiary",
        "Marking_01",
        "Marking_02",
        "Corporation",
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
