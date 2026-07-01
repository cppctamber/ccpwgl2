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

        const normalized = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        out[normalized] = normalizeEsiObject(value[key]);
    }
    return out;
}

function applyAliases(item, aliases)
{
    if (!item) return item;

    for (let i = 0; i < aliases.length; i++)
    {
        const alias = aliases[i],
            source = alias[0],
            target = alias[1];

        if (item[source] !== undefined && item[target] === undefined)
        {
            item[target] = item[source];
        }
    }

    return item;
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

    async GetRouteIDNormalized(route, id, params, aliases = [])
    {
        const item = normalizeEsiObject(await this.GetRouteID(route, id, params));
        return applyAliases(item, aliases);
    }

    GetCollection(route, id, params, aliases = [])
    {
        if (id !== undefined && id !== null)
        {
            return this.GetRouteIDNormalized(route, id, params, aliases);
        }

        return this.GetRoute(route, params);
    }

    GetCharacter(characterID, params)
    {
        return this.GetRouteID(TnyESIRoute.CHARACTERS, characterID, params);
    }

    GetCharacterPortraits(characterID, params)
    {
        return this.GetRouteID(TnyESIRoute.CHARACTERS, characterID, params, "portrait");
    }

    GetCorporation(corporationID, params)
    {
        return this.GetRouteID(TnyESIRoute.CORPORATIONS, corporationID, params);
    }

    GetCorporationLogos(corporationID, params)
    {
        return this.GetRouteID(TnyESIRoute.CORPORATIONS, corporationID, params, "icons");
    }

    GetAlliance(allianceID, params)
    {
        return this.GetRouteID(TnyESIRoute.ALLIANCES, allianceID, params);
    }

    GetAllianceLogos(allianceID, params)
    {
        return this.GetRouteID(TnyESIRoute.ALLIANCES, allianceID, params, "icons");
    }

    GetType(typeID, params)
    {
        return this.GetRouteID(TnyESIRoute.TYPES, typeID, params);
    }

    GetCategory(categoryID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.CATEGORIES, categoryID, params, [
            [ "categoryId", "categoryID" ]
        ]);
    }

    GetGroup(groupID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.GROUPS, groupID, params, [
            [ "categoryId", "categoryID" ],
            [ "groupId", "groupID" ]
        ]);
    }

    GetMarketGroup(marketGroupID, params)
    {
        return this.GetRouteIDNormalized(TnyESIRoute.MARKET_GROUPS, marketGroupID, params, [
            [ "marketGroupId", "marketGroupID" ],
            [ "parentGroupId", "parentGroupID" ]
        ]);
    }

    GetGraphic(graphicID, params)
    {
        return this.GetRouteID(TnyESIRoute.GRAPHICS, graphicID, params);
    }

    async GetResPathFromGraphicID(graphicID, params)
    {
        if (!graphicID) throw new Error("Graphic ID not found");

        const graphic = await this.GetGraphic(graphicID, params);
        return graphic.sof_dna || graphic.sofDna || graphic.graphic_file || graphic.graphicFile || "";
    }

    async GetResPathFromTypeID(typeID, params)
    {
        const type = await this.GetType(typeID, params),
            graphicID = type.graphic_id || type.graphicId;
        return this.GetResPathFromGraphicID(graphicID, params);
    }

    GetMoon(moonID, params)
    {
        return this.GetRouteID(TnyESIRoute.MOONS, moonID, params);
    }

    GetPlanet(planetID, params)
    {
        return this.GetRouteID(TnyESIRoute.PLANETS, planetID, params);
    }

    GetSystem(systemID, params)
    {
        return this.GetRouteID(TnyESIRoute.SYSTEMS, systemID, params);
    }

}
