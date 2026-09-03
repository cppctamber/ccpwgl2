import { meta } from "utils";
import { resMan } from "global";


const
    ESI_ROOT = "https://esi.evetech.net",
    ESI_VERSION = "latest",
    ESI_DATA_SOURCE = "tranquility",
    ESI_LANGUAGE = "en-us";

export const TnyESIRoute = {
    ALLIANCES: "alliances",
    CATEGORIES: "universe/categories",
    CHARACTERS: "characters",
    CORPORATIONS: "corporations",
    GRAPHICS: "universe/graphics",
    GROUPS: "universe/groups",
    MARKET_GROUPS: "markets/groups",
    MOONS: "universe/moons",
    PLANETS: "universe/planets",
    SYSTEMS: "universe/systems",
    TYPES: "universe/types"
};


/**
 * Rewrites ESI's snake_case keys as camelCase, recursively.
 *
 * `_id` becomes `ID` rather than `Id`, so `planet_id` reads as `planetID` and
 * matches how the rest of the library spells it. A consumer of a non-ESI
 * service cannot assume this happened - see `TnyCelestial`.
 *
 * @param {*} value
 * @returns {*}
 */
function normalizeEsiObject(value)
{
    if (Array.isArray(value)) return value.map(normalizeEsiObject);
    if (!value || typeof value !== "object") return value;

    const out = {};
    for (const key in value)
    {
        if (!value.hasOwnProperty(key)) continue;

        const normalized = key.split("_").map((part, index) =>
        {
            if (part === "id") return "ID";
            if (index === 0) return part;
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join("");
        out[normalized] = normalizeEsiObject(value[key]);
    }
    return out;
}

/**
 * A type's graphic record.
 *
 * `sofDna` wins over `graphicFile` wherever both are read: a hull answers with
 * dna, and the non-sof family (scenes, suns, planets, moons, lensflares)
 * answers with a path instead. Either is a valid answer.
 *
 * @typedef {Object} TnyGraphic
 * @property {String} [sofDna]      - sof dna, for anything sof builds
 * @property {String} [graphicFile] - a resource path, for anything it does not
 */

/**
 * What `ResolveTypeDna` builds for a typeID.
 *
 * @typedef {Object} TnyDnaResolution
 * @property {String} dna       - a sof dna string
 * @property {Number} typeID
 * @property {Number} graphicID
 * @property {?Number} skinID   - always null here; the skin provider fills it
 * @property {?String} name     - the type's name
 */

/**
 * A celestial record, as ESI answers it.
 *
 * Keys arrive camelCased by `normalizeEsiObject`, so `shader_preset` reads as
 * `shaderPreset`. A non-ESI service may not normalise, which is why
 * `TnyPlanet` looks up both spellings, and `attributes` as well as the top
 * level.
 *
 * The three graphic fields are graphicIDs, not paths. They resolve through
 * `GetGraphic` to reach a `graphicFile`.
 *
 * @typedef {Object} TnyCelestial
 * @property {Number} [radius]       - metres
 * @property {String} [name]
 * @property {Number} [shaderPreset] - graphicID of the surface shader
 * @property {Number} [heightMap1]   - graphicID
 * @property {Number} [heightMap2]   - graphicID
 */

@meta.define("TnyESIApiProvider")
export class TnyESIApiProvider
{

    root = ESI_ROOT;
    version = ESI_VERSION;
    datasource = ESI_DATA_SOURCE;
    language = ESI_LANGUAGE;
    fetcher = null;
    cache = new Map();

    constructor(options = {})
    {
        if (options.root) this.root = options.root;
        if (options.version) this.version = options.version;
        if (options.datasource) this.datasource = options.datasource;
        if (options.language) this.language = options.language;
        if (options.fetcher) this.fetcher = options.fetcher;
        if (options.cache) this.cache = options.cache;
    }

    /**
     * Empties the response cache. Cached promises are keyed by url, so this
     * also drops any request still in flight.
     * @returns {TnyESIApiProvider}
     */
    ClearCache()
    {
        this.cache.clear();
        return this;
    }

    /**
     * Builds a route url, lower-cased, with `language` and `datasource`
     * applied and every parameter sorted, so the same request always produces
     * the same cache key.
     * @param {String} endpoint
     * @param {Object} [params]
     * @returns {String}
     */
    BuildUrl(endpoint, params)
    {
        params = Object.assign({ language: this.language, datasource: this.datasource }, params);

        let keys = Object.keys(params).sort(),
            url = `${this.root}/${this.version}/${endpoint}`;

        if (url.lastIndexOf("/") !== url.length - 1)
        {
            url += "/";
        }

        for (let i = 0; i < keys.length; i++)
        {
            url += `${i === 0 ? "?" : "&"}${keys[i]}=${params[keys[i]]}`;
        }

        return url.toLowerCase();
    }

    /**
     * Fetches json, caching the PROMISE rather than the result, so concurrent
     * callers share one request instead of racing.
     * @param {String} url
     * @returns {Promise<*>}
     */
    FetchJSON(url)
    {
        if (!this.cache.has(url))
        {
            const fetcher = this.fetcher || resMan.FetchRaw.bind(resMan);
            this.cache.set(url, fetcher(url, "json"));
        }

        return this.cache.get(url);
    }

    /**
     * @param {String} route - a `TnyESIRoute` value
     * @param {Object} [params]
     * @returns {Promise<*>} the route's own shape, NOT normalised
     */
    GetRoute(route, params)
    {
        return this.FetchJSON(this.BuildUrl(route, params));
    }

    /**
     * @param {String} route - a `TnyESIRoute` value
     * @param {Number|String} id
     * @param {Object} [params]
     * @param {String} [path] - a sub-resource, e.g. "portrait"
     * @returns {Promise<*>} the route's own shape, NOT normalised
     */
    GetRouteID(route, id, params, path)
    {
        let endpoint = `${route}/${id}`;

        if (path)
        {
            if (path.charAt(0) !== "/") path = "/" + path;
            endpoint += path;
        }

        return this.GetRoute(endpoint, params);
    }

    /**
     * As `GetRouteID`, with the keys camelCased. Anything a consumer reads by
     * name should come through here.
     * @param {String} route
     * @param {Number|String} id
     * @param {Object} [params]
     * @param {String} [path]
     * @returns {Promise<*>}
     */
    async GetRouteIDNormalized(route, id, params, path)
    {
        return normalizeEsiObject(await this.GetRouteID(route, id, params, path));
    }

    /**
     * One record when given an id, the whole collection when not.
     * @param {String} route
     * @param {Number|String} [id]
     * @param {Object} [params]
     * @returns {Promise<*|Array>}
     */
    GetCollection(route, id, params)
    {
        if (id !== undefined && id !== null)
        {
            return this.GetRouteIDNormalized(route, id, params);
        }

        return this.GetRoute(route, params);
    }

    /**
     * @param {Number} characterID
     * @param {Object} [params]
     * @returns {Promise<Object>}
     */
    GetCharacter(characterID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CHARACTERS, characterID, params);
    }

    /**
     * @param {Number} characterID
     * @param {Object} [params]
     * @returns {Promise<Object>} portrait urls by size
     */
    GetCharacterPortraits(characterID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CHARACTERS, characterID, params, "portrait");
    }

    /**
     * @param {Number} corporationID
     * @param {Object} [params]
     * @returns {Promise<Object>}
     */
    GetCorporation(corporationID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CORPORATIONS, corporationID, params);
    }

    /**
     * @param {Number} corporationID
     * @param {Object} [params]
     * @returns {Promise<Object>} logo urls by size
     */
    GetCorporationLogos(corporationID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CORPORATIONS, corporationID, params, "icons");
    }

    /**
     * @param {Number} allianceID
     * @param {Object} [params]
     * @returns {Promise<Object>}
     */
    GetAlliance(allianceID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.ALLIANCES, allianceID, params);
    }

    /**
     * @param {Number} allianceID
     * @param {Object} [params]
     * @returns {Promise<Object>} logo urls by size
     */
    GetAllianceLogos(allianceID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.ALLIANCES, allianceID, params, "icons");
    }

    /**
     * @param {Number} typeID
     * @param {Object} [params]
     * @returns {Promise<Object>} carries `graphicID` and `name`
     */
    GetType(typeID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.TYPES, typeID, params);
    }

    /**
     * @param {Number} categoryID
     * @param {Object} [params]
     * @returns {Promise<Object>}
     */
    GetCategory(categoryID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CATEGORIES, categoryID, params);
    }

    /**
     * @param {Number} groupID
     * @param {Object} [params]
     * @returns {Promise<Object>}
     */
    GetGroup(groupID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.GROUPS, groupID, params);
    }

    /**
     * @param {Number} marketGroupID
     * @param {Object} [params]
     * @returns {Promise<Object>}
     */
    GetMarketGroup(marketGroupID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.MARKET_GROUPS, marketGroupID, params);
    }

    /**
     * @param {Number} graphicID
     * @param {Object} [params]
     * @returns {Promise<TnyGraphic>}
     */
    GetGraphic(graphicID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.GRAPHICS, graphicID, params);
    }

    /**
     * Either dna or a path, whichever the graphic carries, `sofDna` first.
     * @param {Number} graphicID
     * @param {Object} [params]
     * @returns {Promise<String>} empty when the graphic carries neither
     */
    async GetResPathFromGraphicID(graphicID, params)
    {
        if (!graphicID) throw new Error("Graphic ID not found");

        const graphic = await this.GetGraphic(graphicID, params);
        return graphic.sofDna || graphic.graphicFile || "";
    }

    /**
     * @param {Number} typeID
     * @param {Object} [params]
     * @returns {Promise<String>} dna or a path, via the type's graphicID
     */
    async GetResPathFromTypeID(typeID, params)
    {
        const type = await this.GetType(typeID, params),
            graphicID = type.graphicID;
        return this.GetResPathFromGraphicID(graphicID, params);
    }

    /**
     * @param {Number} typeID
     * @param {Object} [params]
     * @returns {Promise<TnyDnaResolution>}
     * @throws {ReferenceError} when the graphic has neither dna nor a file
     */
    async ResolveTypeDna(typeID, params)
    {
        const type = await this.GetType(typeID, params),
            graphicID = type.graphicID,
            graphic = await this.GetGraphic(graphicID, params),
            dna = graphic.sofDna || graphic.graphicFile || "";

        if (!dna)
        {
            throw new ReferenceError(`Graphic ${graphicID} has no SOF DNA or graphic file`);
        }

        return {
            typeID: Number(typeID),
            graphicID: Number(graphicID),
            skinID: null,
            name: type.name || null,
            dna
        };
    }

    /**
     * @param {Number} moonID
     * @param {Object} [params]
     * @returns {Promise<TnyCelestial>}
     */
    GetMoon(moonID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.MOONS, moonID, params);
    }

    /**
     * @param {Number} planetID
     * @param {Object} [params]
     * @returns {Promise<TnyCelestial>}
     */
    GetPlanet(planetID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.PLANETS, planetID, params);
    }

    /**
     * @param {Number} systemID
     * @param {Object} [params]
     * @returns {Promise<Object>}
     */
    GetSystem(systemID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.SYSTEMS, systemID, params);
    }

}
