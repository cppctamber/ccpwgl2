import { meta } from "utils";
import { Tw2Error } from "core";
import { EveSOFDataPatternLayer } from "./EveSOFDataPatternLayer";
import { EveSOFDataPatternPerHull } from "./EveSOFDataPatternPerHull";


@meta.define("EveSOFDataPattern", true)
export class EveSOFDataPattern extends meta.Model
{

    
    @meta.string
    name = ""; // the guid -> gaurantees there is no collision with existing patterns

    @meta.struct("EveSOFDataPatternLayer")
    layer1 = null;

    @meta.struct("EveSOFDataPatternLayer")
    layer2 = null;

    @meta.list("EveSOFDataPatternPerHull")
    projections = [];

    @meta.list("EveSOFDataPatternApplicationGroup")
    applicationGroups = [];

    @meta.boolean
    sof6 = false;

    /**
     * The pattern's own blend mode.
     *
     * Defaults to the overlay permutation because that IS the default blend
     * mode, rather than to a sentinel meaning "unset". Nothing is lost by
     * saying so: `GetPatternBlendMode` skips any value resolving to `NONE`,
     * and overlay resolves to exactly that, so an unchanged default falls
     * through to the layers on its own.
     *
     * Accepts either vocabulary - a `CustomMaskBlendMode` number, a bare name,
     * or a `BLEND_MODE_` permutation - since `EveCustomMask.GetBlendMode`
     * resolves all three.
     *
     * This exists so a consumer can carry a design-level blend mode without the
     * sof builder having to know what the consumer is. `GetPatternBlendMode`
     * used to read a `pattern.skinr` sidecar for this, which meant EveSOF knew
     * what SKINR was.
     *
     * @type {String|Number}
     */
    @meta.unknown
    blendMode = "BLEND_MODE_OVERLAY";


    /**
     * Checks if a pattern projection exists
     * @param {string} hullName
     * @returns {boolean}
     */
    Has(hullName)
    {
        return this.IndexOfProjection(hullName) !== -1;
    }

    /**
     * Gets a pattern projection
     * @param {String} hullName
     * @returns {Object}
     */
    Get(hullName)
    {
        const index = this.IndexOfProjection(hullName);

        if (index === -1)
        {
            throw new ErrSOFProjectionNotFound({ pattern: this.name, projection: hullName });
        }

        return {
            name: this.name,
            layer1: this.layer1,
            layer2: this.layer2,
            transformLayer1: this.projections[index].transformLayer1,
            transformLayer2: this.projections[index].transformLayer2
        };
    }

    /**
     * Gets the index of a projection
     * @param {String} hullName
     * @returns {number}
     */
    IndexOfProjection(hullName)
    {
        for (let i = 0; i < this.projections.length; i++)
        {
            if (this.projections[i].name.toUpperCase() === hullName.toUpperCase())
            {
                return i;
            }
        }

        return -1;
    }

    /**
     * Empties the pattern
     */
    EmptyLayers()
    {
        if (this.layer1) this.layer1.Empty();
        if (this.layer2) this.layer2.Empty();
    }

    /**
     * Flips layers
     */
    FlipLayers()
    {
        const layer1 = this.layer1;
        this.layer1 = this.layer2;
        this.layer2 = layer1;
    }

    /**
     * Flips transform layers
     */
    FlipTransformLayers()
    {
        for (let i = 0; i < this.projections.length; i++)
        {
            this.projections[i].Flip();
        }
    }

    /**
     * Flips all layers
     */
    Flip()
    {
        this.FlipLayers();
        this.FlipTransformLayers();
    }

    /**
     * Updates the pattern from custom masks array
     * @param {EveCustomMask} [customMask1]
     * @param {EveCustomMask} [customMask2]
     */
    SetLayersFromCustomMasks(customMask1, customMask2)
    {
        if (customMask1)
        {
            this.layer1 = this.layer1 || new EveSOFDataPatternLayer("PatternMask1Map");
            this.layer1.SetFromCustomMask(customMask1);
        }
        else
        {
            this.layer1 = null;
        }

        if (customMask2)
        {
            this.layer2 = this.layer2 || new EveSOFDataPatternLayer("PatternMask2Map");
            this.layer2.SetFromCustomMask(customMask2);
        }
        else
        {
            this.layer2 = null;
        }
    }

    /**
     * Sets a per hull projection from custom masks
     * @param {String} hullName
     * @param {EveCustomMask} [customMask1]
     * @param {EveCustomMask} [customMask2]
     */
    SetHullProjectionFromCustomMasks(hullName, customMask1, customMask2)
    {
        if (!hullName) throw new Error(`Invalid hull name: ${hullName}`);
        let found = this.projections.find(x => x.name === hullName);
        if (!found)
        {
            found = new EveSOFDataPatternPerHull(hullName);
            this.projections.push(found);
        }
        found.SetTransformLayer1FromCustomMask(customMask1);
        found.SetTransformLayer2FromCustomMask(customMask2);
    }

}

/**
 * Fires when a sof pattern projection is not found
 */
export class ErrSOFProjectionNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF pattern projection '%projection%' not found for pattern '%pattern%'");
    }
}
