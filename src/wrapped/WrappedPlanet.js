import { meta } from "utils";
import { EvePlanet } from "eve/object";
import { WrappedGenericObject } from "./WrappedGenericObject";


@meta.type("WrappedPlanet")
export class WrappedPlanet extends WrappedGenericObject
{

    /**
     * Constructor
     * @param {EvePlanet} wrapped
     * @param {Object} [values]
     */
    constructor(wrapped, values)
    {
        if (!(wrapped instanceof EvePlanet))
        {
            throw new TypeError("Invalid wrapped object");
        }

        super();
        this.wrapped = wrapped;
        if (values) this.SetValues(values);
    }

    /**
     * Gets the object's long axis
     * @return {number}
     */
    GetLongAxis()
    {
        const worldScale = this.GetWorldScale([]);
        return Math.max(worldScale[0], worldScale[1], worldScale[2]);
    }

    /**
     * Fetches a planet async
     * @param {Object} options
     * @return {Promise<WrappedPlanet>}
     */
    static async fetch(options = {})
    {
        const { itemID, resPath, heightMap1, heightMap2, atmospherePath, ...values } = options;

        if (resPath)
        {
            const wrapped = new EvePlanet();
            await wrapped.Fetch({ itemID, resPath, heightMap1, heightMap2, atmospherePath });
            wrapped._resPath = resPath;
            wrapped._atmospherePath = atmospherePath;
            return new this(wrapped, values);
        }

        throw new ReferenceError("Could not identify resource path");
    }

}
