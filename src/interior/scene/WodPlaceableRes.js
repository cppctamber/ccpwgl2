import { meta } from "utils";


@meta.type("WodPlaceableRes")
@meta.ccp.define("WodPlaceableRes")
export class WodPlaceableRes extends meta.Model
{

    @meta.float
    farFadeDistance = 0;

    @meta.float
    nearFadeDistance = 0;

    @meta.struct("Tr2Model")
    visualModel = null;

    /**
     * Initializes the visual model
     */
    Initialize()
    {
        if (this.visualModel && this.visualModel.Initialize)
        {
            this.visualModel.Initialize();
        }
    }

    /**
     * Checks if the visual model is ready
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(this.visualModel && this.visualModel.IsGood && this.visualModel.IsGood());
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        if (this.visualModel && this.visualModel.GetResources)
        {
            this.visualModel.GetResources(out);
        }
        return out;
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {*} accumulator
     * @param {*} perObjectData
     * @returns {Boolean}
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        return this.visualModel && this.visualModel.GetBatches
            ? this.visualModel.GetBatches(mode, accumulator, perObjectData)
            : false;
    }

    /**
     * Gets a bounding box
     * @param {*} out
     * @returns {*}
     */
    GetBoundingBox(out)
    {
        return this.visualModel && this.visualModel.GetBoundingBox
            ? this.visualModel.GetBoundingBox(out)
            : null;
    }

    /**
     * Gets a bounding sphere
     * @param {*} out
     * @returns {*}
     */
    GetBoundingSphere(out)
    {
        return this.visualModel && this.visualModel.GetBoundingSphere
            ? this.visualModel.GetBoundingSphere(out)
            : null;
    }

}
