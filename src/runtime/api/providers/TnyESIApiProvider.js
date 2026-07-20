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

@meta.tny.type("TnyESIApiProvider")
@meta.tny.define("TnyESIApiProvider")
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

    ClearCache()
    {
        this.cache.clear();
        return this;
    }

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

    FetchJSON(url)
    {
        if (!this.cache.has(url))
        {
            const fetcher = this.fetcher || resMan.FetchRaw.bind(resMan);
            this.cache.set(url, fetcher(url, "json"));
        }

        return this.cache.get(url);
    }

    GetRoute(route, params)
    {
        return this.FetchJSON(this.BuildUrl(route, params));
    }

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

    async GetRouteIDNormalized(route, id, params, path)
    {
        return normalizeEsiObject(await this.GetRouteID(route, id, params, path));
    }

    GetCollection(route, id, params)
    {
        if (id !== undefined && id !== null)
        {
            return this.GetRouteIDNormalized(route, id, params);
        }

        return this.GetRoute(route, params);
    }

    GetCharacter(characterID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CHARACTERS, characterID, params);
    }

    GetCharacterPortraits(characterID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CHARACTERS, characterID, params, "portrait");
    }

    GetCorporation(corporationID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CORPORATIONS, corporationID, params);
    }

    GetCorporationLogos(corporationID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CORPORATIONS, corporationID, params, "icons");
    }

    GetAlliance(allianceID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.ALLIANCES, allianceID, params);
    }

    GetAllianceLogos(allianceID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.ALLIANCES, allianceID, params, "icons");
    }

    GetType(typeID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.TYPES, typeID, params);
    }

    GetCategory(categoryID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CATEGORIES, categoryID, params);
    }

    GetGroup(groupID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.GROUPS, groupID, params);
    }

    GetMarketGroup(marketGroupID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.MARKET_GROUPS, marketGroupID, params);
    }

    GetGraphic(graphicID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.GRAPHICS, graphicID, params);
    }

    async GetResPathFromGraphicID(graphicID, params)
    {
        if (!graphicID) throw new Error("Graphic ID not found");

        const graphic = await this.GetGraphic(graphicID, params);
        return graphic.sofDna || graphic.graphicFile || "";
    }

    async GetResPathFromTypeID(typeID, params)
    {
        const type = await this.GetType(typeID, params),
            graphicID = type.graphicID;
        return this.GetResPathFromGraphicID(graphicID, params);
    }

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

    GetMoon(moonID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.MOONS, moonID, params);
    }

    GetPlanet(planetID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.PLANETS, planetID, params);
    }

    GetSystem(systemID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.SYSTEMS, systemID, params);
    }

}
