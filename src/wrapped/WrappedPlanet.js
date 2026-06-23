import { meta } from "utils";
import { EvePlanet } from "eve/object";
import { WrappedGenericObject } from "./WrappedGenericObject";
import { api } from "./api";
import { box3, vec3 } from "math";


@meta.type("WrappedPlanet")
export class WrappedPlanet extends WrappedGenericObject
{

    get isPlanet()
    {
        return true;
    }

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
        const worldScale = this.GetWorldScaling([]);
        return Math.max(worldScale[0], worldScale[1], worldScale[2]);
    }

    GetSize(out=vec3.create())
    {
        return this.GetScale(out);
    }

    /**
     * Fetches a planet async
     * @param {Object} options
     * @return {Promise<WrappedPlanet>}
     */
    static async fetch(options = {})
    {
        let { itemID, resPath, heightMap1, heightMap2, atmospherePath, moonID, planetID, ...values } = options;

        if (moonID || planetID)
        {
            const data = moonID ? await api.getMoonID(moonID) : await api.getPlanetID(planetID);

            const [ shader, hm1, hm2 ] = await Promise.all([
                api.getGraphicID(data.shader_preset),
                data.height_map_1 ? api.getGraphicID(data.height_map_1) : null,
                data.height_map_2 ? api.getGraphicID(data.height_map_2) : null
            ]);

            itemID = moonID || planetID;

            // Keep track of this info...
            values.name = data.name;

            values.custom = {
                position : [ data.position.x, data.position.y, data.position.z ],
                system_id: data.system_id,
                [moonID ? "moon_id" : "planet_id"]: itemID
            };

            if (!resPath) resPath = shader.graphic_file;
            if (!heightMap1 && hm1) heightMap1 = hm1.graphic_file.replace(".dds", ".png").replace("res:", "cdn:");
            if (!heightMap2 && hm2) heightMap2 = hm2.graphic_file.replace(".dds", ".png").replace("res:", "cdn:");
            if (!values.radius) values.radius = data.radius;
        }

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



