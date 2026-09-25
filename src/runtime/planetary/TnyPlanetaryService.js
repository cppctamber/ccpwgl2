import { TnyPlanetaryColony, CreatePlanetaryPinMesh } from "./TnyPlanetaryColony";


/**
 * Runtime owner for rendered planetary colonies.
 *
 * Data fetching stays in TnyApiService. This service associates one editable
 * colony view with each planet and caches immutable render meshes. Per-frame
 * animation is owned by TnyPlanet in the scene's wrapper update pass.
 */
export class TnyPlanetaryService
{

    static serviceName = "planetary";

    client = null;
    colonies = new Map();
    pinMeshes = new Map();

    /** @param {TnyClient|null} [client=null] */
    constructor(client = null)
    {
        this.client = client;
    }

    /** @param {TnyClient|null} client @returns {TnyPlanetaryService} */
    SetClient(client)
    {
        this.client = client || null;
        return this;
    }

    /**
     * Creates or replaces the one rendered colony associated with a planet.
     * The caller supplies plain colony JSON; fetching belongs to TnyApiService.
     * @param {TnyPlanet} planet
     * @param {Object} data - ESI-shaped `pins`, `links` and `routes`
     * @param {Object} [options]
     * @returns {Promise<TnyPlanetaryColony>}
     */
    async Setup(planet, data, options = {})
    {
        if (!planet?.isPlanet) throw new TypeError("Planetary setup requires a TnyPlanet");

        let colony = this.colonies.get(planet) || planet.GetColony?.() || null;
        if (!colony)
        {
            colony = new TnyPlanetaryColony(planet, {
                service: this,
                scene: options.scene || this.client?.scene || null
            });
        }

        colony.service = this;
        colony.scene = options.scene || colony.scene || this.client?.scene || null;
        this.colonies.set(planet, colony);
        planet._planetaryColony = colony;
        planet.colony = colony;
        await colony.SetData(data, { ...options, scene: colony.scene, service: this });
        return colony;
    }

    /** @param {TnyPlanet} planet @returns {TnyPlanetaryColony|null} */
    Get(planet)
    {
        return this.colonies.get(planet) || null;
    }

    /** @param {TnyPlanet} planet @returns {Boolean} Whether a colony was removed. */
    Remove(planet)
    {
        const colony = this.colonies.get(planet);
        if (!colony) return false;
        this.colonies.delete(planet);
        colony.Dispose();
        if (planet._planetaryColony === colony) planet._planetaryColony = null;
        if (planet.colony === colony) planet.colony = null;
        return true;
    }

    /** Removes every managed colony. @returns {TnyPlanetaryService} */
    Clear()
    {
        for (const planet of [ ...this.colonies.keys() ]) this.Remove(planet);
        return this;
    }

    /**
     * Gets a cached immutable sphere-pin mesh for a texture combination.
     * @param {String} texture
     * @param {String|null} [thresholdTexture=null]
     * @returns {Tw2Mesh}
     */
    GetPinMesh(texture, thresholdTexture = null)
    {
        const key = `${texture}\n${thresholdTexture || ""}`;
        if (!this.pinMeshes.has(key))
        {
            this.pinMeshes.set(key, CreatePlanetaryPinMesh(texture, thresholdTexture));
        }
        return this.pinMeshes.get(key);
    }

    /** Releases managed colonies and cached meshes. @returns {TnyPlanetaryService} */
    Dispose()
    {
        this.Clear();
        this.pinMeshes.clear();
        this.client = null;
        return this;
    }

}
