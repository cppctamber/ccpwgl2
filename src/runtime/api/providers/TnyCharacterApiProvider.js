import { meta } from "utils";
import { TnyGeneratedLibraryProvider } from "./TnyGeneratedLibraryProvider";


@meta.tny.type("TnyCharacterApiProvider")
@meta.tny.define("TnyCharacterApiProvider")
export class TnyCharacterApiProvider extends TnyGeneratedLibraryProvider
{

    characterUrl = null;
    apiRoot = null;
    apiFetcher = null;
    apiProvider = null;
    apiCache = new Map();
    unavailableLibraryUrls = new Set();

    constructor(options = {})
    {
        super(options);

        if (options.hasOwnProperty("characterUrl")) this.characterUrl = options.characterUrl;
        if (options.toolsService)
        {
            this.SetToolsService(options.toolsService, options);
        }
        if (options.apiRoot) this.apiRoot = String(options.apiRoot).replace(/\/+$/, "");
        if (options.apiFetcher) this.apiFetcher = options.apiFetcher;
        if (options.apiProvider) this.apiProvider = options.apiProvider;
        if (options.apiCache) this.apiCache = options.apiCache;
    }

    ClearCache()
    {
        super.ClearCache();
        this.apiCache.clear();
        this.unavailableLibraryUrls.clear();
        return this;
    }

    SetToolsService(bootstrap, options = {})
    {
        this.apiRoot = this.constructor.BuildToolsServiceRoot(bootstrap, options);
        return this;
    }

    async GetCharacterLibrary()
    {
        const library = await this.TryGetLibrary(this.characterUrl);

        if (library) return library;
        if (this.apiRoot) return this.FetchApiJSON("character");
        return this.RequestApiProvider("GetCharacterLibrary");
    }

    async LookupCharacterName(name)
    {
        const value = NormalizeName(name);

        return this.apiRoot
            ? this.FetchApiJSON("character/lookup", { name: value })
            : this.RequestApiProvider("LookupCharacterName", value);
    }

    async SearchCharacterName(name)
    {
        const value = NormalizeName(name);

        return this.apiRoot
            ? this.FetchApiJSON("character/search", { name: value })
            : this.RequestApiProvider("SearchCharacterName", value);
    }

    async ResolveCharacterName(name, lod = null)
    {
        const query = WithLod({ name: NormalizeName(name) }, lod);

        return this.apiRoot
            ? this.FetchApiJSON("character/resolve", query)
            : this.RequestApiProvider("ResolveCharacterName", name, lod);
    }

    async GetCharacterPartByTypeID(typeID, lod = null)
    {
        const value = NormalizeTypeID(typeID),
            query = WithLod({}, lod);

        return this.apiRoot
            ? this.FetchApiJSON(`character/types/${encodeURIComponent(value)}`, query)
            : this.RequestApiProvider("GetCharacterPartByTypeID", value, lod);
    }

    async GetCharacterPartsByCategory(category, lod = null)
    {
        const path = NormalizeCategory(category)
                .split("/")
                .map(encodeURIComponent)
                .join("/"),
            query = WithLod({}, lod);

        return this.apiRoot
            ? this.FetchApiJSON(`character/${path}`, query)
            : this.RequestApiProvider("GetCharacterPartsByCategory", category, lod);
    }

    async TryGetLibrary(url)
    {
        const key = String(url || "");

        if (!key || this.unavailableLibraryUrls.has(key))
        {
            return null;
        }

        try
        {
            return await this.GetLibrary(key);
        }
        catch (error)
        {
            if (!this.apiRoot && !this.apiProvider) throw error;
            this.unavailableLibraryUrls.add(key);
            return null;
        }
    }

    RequestApiProvider(method, ...args)
    {
        if (this.apiProvider && this.apiProvider[method])
        {
            return this.apiProvider[method](...args);
        }

        throw new Error(`TnyCharacterApiProvider API method not found: ${method}`);
    }

    BuildApiUrl(path, query)
    {
        if (!this.apiRoot)
        {
            throw new Error("TnyCharacterApiProvider has no generated-library asset or API root");
        }

        let url = `${this.apiRoot}/${String(path).replace(/^\/+/, "")}`;
        const keys = Object.keys(query || {}).filter(key => query[key] !== null
            && query[key] !== undefined).sort();

        for (let i = 0; i < keys.length; i++)
        {
            const key = keys[i];
            url += `${i ? "&" : "?"}${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`;
        }

        return url;
    }

    FetchApiJSON(path, query)
    {
        const url = this.BuildApiUrl(path, query);

        if (!this.apiCache.has(url))
        {
            const result = Promise.resolve(this.FetchApiValue(url)).catch(error =>
            {
                this.apiCache.delete(url);
                throw error;
            });
            this.apiCache.set(url, result);
        }

        return this.apiCache.get(url);
    }

    async FetchApiValue(url)
    {
        const value = await this.FetchJSON(url, this.apiFetcher);

        if (value === null || value === undefined)
        {
            throw new TypeError(`Character API ${url} returned no data`);
        }

        return value;
    }

    static BuildToolsServiceRoot(bootstrap, options = {})
    {
        const port = Number(bootstrap && bootstrap.port);

        if (!bootstrap || !bootstrap.host || !Number.isSafeInteger(port)
            || port < 1 || port > 65535)
        {
            throw new TypeError("Invalid tools-core service bootstrap");
        }

        const host = String(bootstrap.host).includes(":")
                ? `[${bootstrap.host}]`
                : bootstrap.host,
            target = encodeURIComponent(options.target || "eve"),
            build = encodeURIComponent(options.build || "latest"),
            scheme = options.scheme || "http";

        return `${scheme}://${host}:${port}/${target}/${build}`;
    }

}

function NormalizeName(value)
{
    const name = String(value || "").trim();

    if (!name)
    {
        throw new TypeError("Character name lookup requires a non-empty name");
    }

    return name;
}

function NormalizeTypeID(value)
{
    const typeID = Number(value);

    if (!Number.isSafeInteger(typeID) || typeID <= 0)
    {
        throw new TypeError(`Invalid character typeID: ${value}`);
    }

    return String(typeID);
}

function NormalizeCategory(value)
{
    const category = String(value || "").trim().replace(/^\/+|\/+$/gu, "");

    if (!category || category.split("/").some(part => !part))
    {
        throw new TypeError("Character category requires a non-empty path");
    }

    return category;
}

function WithLod(query, value)
{
    if (value === null || value === undefined) return query;

    const lod = Number(value);

    if (!Number.isSafeInteger(lod) || lod < 0)
    {
        throw new TypeError(`Invalid character LOD: ${value}`);
    }

    return { ...query, lod };
}
