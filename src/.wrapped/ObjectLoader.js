import {tw2, vec3} from "../global";
import {isNumber, isObjectObject, isPlain, isString} from "../global/util";

export class Fetch
{

    api = {
        root: "https://esi.evetech.net",
        version: "latest",
        params: {
            language: "en-us",
            dataSource: "tranquility"
        }
    };

    constructor(loader)
    {

    }

    /**
     * Loads a ship
     * @param options
     * @returns {Promise<Ship>}
     */
    async ship(options = {})
    {
        options = Fetch.ParseOptions(options);
        if (options.id) options.resPath = await Fetch.FetchResPathFromTypeID(this.api, options.id);
        return await Ship.fetch(options);
    }

    async object(options = {})
    {
        options = Fetch.ParseOptions(options);
        if (options.id) options.resPath = await Fetch.FetchResPathFromTypeID(this.api, options.id);
        return await SpaceObject.fetch(options);
    }

    async station(options = {})
    {
        options = Fetch.ParseOptions(options);
        if (options.id) options.resPath = await Fetch.FetchResPathFromTypeID(this.api, options.id);
        return await SpaceObject.fetch(options);
    }

    async stargate(options = {})
    {

    }

    async moon(options = {})
    {
        options = Fetch.ParseOptions(options);
        if (options.id)
        {
            const data = await Fetch.FetchGraphicDataFromPlanetaryBody(this.api, Fetch.Universe.MOONS, options.id);
            options = Object.assign({}, options, data);
        }

        // LOAD MOON
    }

    async planet(options = {})
    {
        options = Fetch.ParseOptions(options);
        if (options.id)
        {
            const data = await Fetch.FetchGraphicDataFromPlanetaryBody(this.api, Fetch.Universe.PLANETS, options.id);
            options = Object.assign({}, options, data);
        }

        // LOAD MOON
    }

    async star(options = {})
    {

    }

    async sun(options = {})
    {

    }

    /**
     * Parses options
     * @param {String|Number|Object} options
     * @param {Function} [handler]
     * @returns {Promise<*>}
     */
    static async ParseOptions(options, handler)
    {
        if (!isPlain(options))
        {
            if (isNumber(options))
            {
                options = { id: options };
            }
            else if (isString(options))
            {
                options = { resPath: options }
            }
            else
            {
                throw new Error("Invalid options");
            }
        }

        if (handler)
        {
            options = await handler(options);
        }

        const { position } = options;
        if (position && position.x)
        {
            options.position = vec3.fromValues(position.x, position.y, position.z);
        }

        return options;
    }

    /**
     * Gets graphic data for a moon or planet
     * @param {*} api
     * @param {String} endpoint
     * @param {Number} id
     * @returns {Promise<{planetPath: String, radius: String, heightMap1: String, heightMap2: String}>}
     */
    static async FetchGraphicDataFromPlanetaryBody(api, endpoint, id)
    {
        const {shader_preset, radius, height_map_1, height_map_2} = await this.FetchID(api, endpoint, id);
        return {planetPath: shader_preset, radius, heightMap1: height_map_1, heightMap2: height_map_2};
    }

    /**
     * Fetches graphic data for a moon
     * @param api
     * @param {Number} moonID
     * @returns {Promise<{planetPath: String, radius: String, heightMap1: String, heightMap2: String}>}
     */
    static async FetchGraphicDataFromMoonID(api, moonID)
    {
        return await this.FetchGraphicDataFromPlanetaryBody(api, this.Universe.MOONS, moonID);
    }

    /**
     * Fetches graphic data for a planet
     * @param api
     * @param {Number} planetID
     * @returns {Promise<{planetPath: String, radius: String, heightMap1: String, heightMap2: String}>}
     */
    static async FetchGraphicDataFromPlanetID(api, planetID)
    {
        return await this.FetchGraphicDataFromPlanetaryBody(api, this.Universe.PLANETS, planetID);
    }

    /**
     * Fetches a res path from a type id
     * @param api
     * @param {Number} typeID
     * @returns {Promise<String>}
     */
    static async FetchResPathFromTypeID(api, typeID)
    {
        const {graphic_id} = await this.FetchID(api, this.Universe.TYPES, typeID);
        return await this.FetchResPathFromGraphicID(api, graphic_id);
    }

    /**
     * Fetches a res path from a graphic id
     * @param api
     * @param {Number} graphicID
     * @returns {Promise<String>}
     */
    static async FetchResPathFromGraphicID(api, graphicID)
    {
        const {sof_dna, res_file} = await this.FetchID(api, this.Universe.GRAPHICS, graphicID);
        return sof_dna || res_file;
    }

    /**
     * Fetches an id
     * @param api
     * @param endpoint
     * @param id
     * @param params
     * @param extendPath
     * @returns {Promise<void>}
     */
    static async FetchID(api, endpoint, id, params, extendPath)
    {
        const
            url = this.BuildURL(api, `${endpoint}/${id}`, params),
            urlExtend = extendPath ? tw2.resMan.BuildURL(extendPath) : "";

        if (!this._cache[url])
        {
            const extendedResult = async (url, urlExtend) =>
            {
                const json = await tw2.resMan.Fetch(url, "json");
                if (urlExtend)
                {
                    const jsonExtend = await tw2.resMan.Fetch(urlExtend, "json");
                    Object.assign(json, jsonExtend);
                }
                return json;
            };

            this._cache[url] = extendedResult(url, urlExtend);
        }

        return await this._cache[url];
    }

    static FetchAll(api, endpoint, params)
    {
        // Handle pagination
    }

    /**
     * Stores url promise
     * @param url
     * @param promise
     */
    static Store(url, promise)
    {
        this._cache[url] = promise;
    }

    /**
     * Retrieves a url promise
     * @param {String} url
     * @returns {Promise<Promise>}
     */
    static async Retrieve(url)
    {
        return await this._cache.get(url);
    }

    /**
     * Cache
     * @type {Map<String, Promise>}
     * @private
     */
    static _cache = new Map();

    /**
     * Builds a url
     * @param {*} api
     * @param {String} endpoint
     * @param {*} [params]
     * @returns {string}
     */
    static BuildURL(api, endpoint, params)
    {
        params = Object.assign({}, params, api.params);

        let param_keys = Object.keys(params).sort(),
            params_string = "",
            url_string = `${api.root}/${api.version}/${endpoint}/`;

        for (let i = 0; i < param_keys.length; i++)
        {
            let prefix = i === 0 ? "?" : "&",
                key = param_keys[i].toLowerCase();

            params_string += `${prefix}${key}=${params[key].toLowerCase()}`
        }

        return url_string + params_string;
    }

    static UniverseExtend = {
        "PLANETS": "static/planets",
        "MOONS": "static/moons",
        "REGIONS": "static/regions"
    };

    static Universe = {
        "TYPES": "universe/types",
        "GRAPHICS": "universe/graphics",
        "GROUPS": "universe/groups",
        "CATEGORIES": "universe/categories",
        "PLANETS": "universe/planets",
        "MOONS": "universe/moons",
        "STATIONS": "universe/stations",
        "STARGATES": "universe/stargates",
        "STARS": "universe/stars",
        "REGIONS": "universe/regions",
        "SOLARSYSTEMS": "universe/solarsystems",
        "CONSTELLATIONS": "universe/constellations"
    };
}
