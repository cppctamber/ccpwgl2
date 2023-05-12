import { meta } from "utils";
import { EveSOFDataPatternTransform } from "./EveSOFDataPatternTransform";


@meta.type("EveSOFDataPatternPerHull")
export class EveSOFDataPatternPerHull extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataPatternTransform")
    transformLayer1 = null;

    @meta.struct("EveSOFDataPatternTransform")
    transformLayer2 = null;

    /**
     * Constructor
     * @param {String} name
     */
    constructor(name="")
    {
        super();
        this.name = name;
    }

    /**
     * Empties the pattern transform
     */
    Empty()
    {
        if (this.transformLayer1) this.transformLayer1.Empty();
        if (this.transformLayer2) this.transformLayer2.Empty();
    }

    /**
     * Flips transform layers
     */
    Flip()
    {
        const layer1 = this.transformLayer1;
        this.transformLayer1 = this.transformLayer2;
        this.transformLayer2 = layer1;
    }

    /**
     * Sets from custom masks
     * @param {EveCustomMask} customMask1
     * @param {EveCustomMask} customMask2
     */
    SetFromCustomMasks(customMask1, customMask2)
    {
        this.SetTransformLayer1FromCustomMask(customMask1);
        this.SetTransformLayer2FromCustomMask(customMask2);
    }

    /**
     * Sets the first transform layer from a custom mask
     * @param {EveCustomMask} [customMask]
     */
    SetTransformLayer1FromCustomMask(customMask)
    {
        if (!customMask)
        {
            this.transformLayer1 = null;
            return;
        }

        if (!this.transformLayer1) this.transformLayer1 = new EveSOFDataPatternTransform();
        this.transformLayer1.SetFromCustomMask(customMask);
    }

    /**
     * Sets the second transform layer from a custom mask
     * @param {EveCustomMask} [customMask]
     */
    SetTransformLayer2FromCustomMask(customMask)
    {
        if (!customMask)
        {
            this.transformLayer2 = null;
            return;
        }

        if (!this.transformLayer2) this.transformLayer2 = new EveSOFDataPatternTransform();
        this.transformLayer2.SetFromCustomMask(customMask);
    }

}
