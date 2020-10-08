import { meta } from "global";
import { Tw2Error } from "core/class";


@meta.ctor("EveSOFDataLogoSet")
export class EveSOFDataLogoSet
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
     * Checks if a logo exists by usage type
     * @param {Number} usageType
     * @returns {boolean}
     */
    Has(usageType)
    {
        const name = EveSOFDataLogoSet.UsageIndex[usageType];
        
        if (name === undefined)
        {
            throw new ErrSOFDataLogoSetUsageTypeUnknown({ usageType });
        }
        
        return !!this[name];
    }

    /**
     * Gets a logo by usage type
     * @param {Number} usageType
     * @returns {EveSOFDataLogo}
     */
    Get(usageType)
    {
        if (!this.Has(usageType))
        {
            throw new ErrSOFDataLogoSetUsageTypeNotFound({ usageType });
        }
        
        return this[EveSOFDataLogoSet.UsageIndex[usageType]];
    }

    /**
     * Usage index
     * TODO: Figure out how to automate this list
     * @usageType {String[]}
     */
    static UsageIndex = [
        "Primary",
        "Secondary",
        "Tertiary",
        "Marking_01",
        "Marking_02"
    ]

}


export class ErrSOFDataLogoSetUsageTypeUnknown extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF logo set usage type unknown (%usageType%)");
        this.unknownUsageType = true;
    }
}

export class ErrSOFDataLogoSetUsageTypeNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF logo set usage type not found (%usageType%)");
    }
}
