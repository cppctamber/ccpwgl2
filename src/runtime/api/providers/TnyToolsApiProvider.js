import { meta } from "utils";
import { resMan } from "global";


@meta.define("TnyToolsApiProvider")
export class TnyToolsApiProvider
{

    apiRoot = null;
    resourceRoot = null;
    fetcher = null;
    postFetcher = null;
    cache = new Map();

    constructor(options = {})
    {
        if (options.apiRoot) this.apiRoot = String(options.apiRoot).replace(/\/+$/, "");
        if (options.resourceRoot) this.resourceRoot = String(options.resourceRoot).replace(/\/+$/, "");
        if (options.fetcher) this.fetcher = options.fetcher;
        if (options.postFetcher) this.postFetcher = options.postFetcher;
        if (options.cache) this.cache = options.cache;
    }

    /**
     * Empties the response cache.
     * @returns {TnyToolsApiProvider}
     */
    ClearCache()
    {
        this.cache.clear();
        return this;
    }

    /**
     * @param {String} path - relative to the api root
     * @param {Object} [query]
     * @returns {Promise<*>}
     */
    FetchApiJSON(path, query)
    {
        if (!this.apiRoot)
        {
            throw new Error("TnyToolsApiProvider requires apiRoot");
        }

        return this.FetchJSON(this.BuildApiUrl(path, query));
    }

    /**
     * Fetches json, caching the PROMISE so concurrent callers share one
     * request.
     * @param {String} url
     * @returns {Promise<*>}
     */
    FetchJSON(url)
    {
        if (!this.cache.has(url))
        {
            const fetcher = this.fetcher || resMan.FetchRaw.bind(resMan);
            const result = Promise.resolve(fetcher(url, "json")).then(value =>
            {
                if (value === null || value === undefined)
                {
                    throw new TypeError(`Tools API ${url} returned no data`);
                }
                return value;
            }).catch(error =>
            {
                this.cache.delete(url);
                throw error;
            });

            this.cache.set(url, result);
        }

        return this.cache.get(url);
    }

    /**
     * POSTs json. Not cached: a post is a question about the body, not about
     * the url.
     * @param {String} path
     * @param {Object} body
     * @returns {Promise<*>}
     */
    async PostApiJSON(path, body)
    {
        if (!this.apiRoot)
        {
            throw new Error("TnyToolsApiProvider requires apiRoot");
        }

        const url = this.BuildApiUrl(path);
        if (this.postFetcher)
        {
            const value = await this.postFetcher(url, body);
            if (value === null || value === undefined)
            {
                throw new TypeError(`Tools API ${url} returned no data`);
            }
            return value;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok)
        {
            throw new Error(`Tools API ${url} failed: ${response.status}`);
        }

        const value = await response.json();
        if (value === null || value === undefined)
        {
            throw new TypeError(`Tools API ${url} returned no data`);
        }
        return value;
    }

    /**
     * @param {String} path
     * @param {Object} [query]
     * @returns {String}
     */
    BuildApiUrl(path, query)
    {
        let url = `${this.apiRoot}/${String(path).replace(/^\/+/, "")}`;
        if (query)
        {
            const params = new URLSearchParams();
            Object.keys(query).sort().forEach(key =>
            {
                if (query[key] !== undefined && query[key] !== null)
                {
                    params.set(key, query[key]);
                }
            });
            const value = params.toString();
            if (value) url += `?${value}`;
        }
        return url;
    }

    /**
     * The url a `res:/` path is served from.
     * @param {String} [path]
     * @returns {String}
     */
    BuildResourceUrl(path = "")
    {
        const root = this.resourceRoot || (this.apiRoot ? `${this.apiRoot}/resources` : null);

        if (!root)
        {
            throw new Error("TnyToolsApiProvider requires resourceRoot or apiRoot");
        }

        const value = String(path).replace(/^\/+/, "");
        return value ? `${root}/${value}` : root;
    }

    /**
     * @returns {Promise<*>} the billboard set a scene may draw
     */
    GetBillboards()
    {
        return this.FetchApiJSON("billboards");
    }

    /**
     * @param {String} [path] - a `res:/` path
     * @returns {Promise<*>}
     */
    GetResource(path = "")
    {
        const resourcePath = NormalizeResourcePath(path);
        return this.FetchJSON(this.BuildResourceUrl(resourcePath));
    }

    /**
     * @returns {Promise<*>} the nebula scenes available as backdrops
     */
    GetNebulas()
    {
        return this.FetchApiJSON("nebulas");
    }

    /**
     * @returns {Promise<*>} the environment cubes available to a scene
     */
    GetCubes()
    {
        return this.FetchApiJSON("cubes");
    }

    /**
     * The res path inserts a hull declares. An insert is the dna fragment that
     * swaps a hull's texture set, so this is what a consumer offers as choices.
     * @param {String} hull - a sof hull name
     * @returns {Promise<*>}
     */
    GetHullResPathInserts(hull)
    {
        return this.FetchApiJSON(
            `sof/hulls/${encodeURIComponent(NormalizePathSegment(hull, "SOF hull"))}/respathinserts`
        );
    }

    /**
     * Rewrites resource paths for one of a hull's inserts, answering which of
     * the supplied paths the insert actually changes.
     * @param {String} hull - a sof hull name
     * @param {String} insert - a res path insert name
     * @param {Array<String>} paths
     * @returns {Promise<*>}
     */
    ResolveHullResPathInserts(hull, insert, paths)
    {
        return this.PostApiJSON(
            `sof/hulls/${encodeURIComponent(NormalizePathSegment(hull, "SOF hull"))}`
                + `/respathinserts/${encodeURIComponent(NormalizePathSegment(insert, "resource path insert"))}`
                + "/resolve",
            { paths }
        );
    }

    /**
     * @returns {Promise<*>} the whole weapon library
     */
    GetWeaponLibrary()
    {
        return this.FetchApiJSON("weapons");
    }

    /**
     * @param {String} name
     * @returns {Promise<*>} exact matches
     */
    LookupWeaponName(name)
    {
        return this.FetchApiJSON("weapons/lookup", { name });
    }

    /**
     * @param {String} name
     * @returns {Promise<*>} looser matches
     */
    SearchWeaponName(name)
    {
        return this.FetchApiJSON("weapons/search", { name });
    }

    /**
     * @returns {Promise<*>} every weapon type
     */
    GetWeaponTypes()
    {
        return this.FetchApiJSON("weapons/types");
    }

    /**
     * @param {Number} typeID
     * @returns {Promise<*>}
     */
    GetWeaponType(typeID)
    {
        return this.FetchApiJSON(`weapons/types/${NormalizeID(typeID, "weapon type ID")}`);
    }

    /**
     * @param {Number} typeID
     * @param {Number} [ammunitionTypeID] - one round, or all of them
     * @returns {Promise<*>}
     */
    GetWeaponAmmunition(typeID, ammunitionTypeID)
    {
        let path = `weapons/types/${NormalizeID(typeID, "weapon type ID")}/ammunition`;
        if (ammunitionTypeID !== undefined && ammunitionTypeID !== null)
        {
            path += `/${NormalizeID(ammunitionTypeID, "ammunition type ID")}`;
        }
        return this.FetchApiJSON(path);
    }

    /**
     * @param {Number} [graphicID] - one projectile, or all of them
     * @returns {Promise<*>}
     */
    GetWeaponProjectiles(graphicID)
    {
        let path = "weapons/projectiles";
        if (graphicID !== undefined && graphicID !== null)
        {
            path += `/${NormalizeID(graphicID, "projectile graphic ID")}`;
        }
        return this.FetchApiJSON(path);
    }

}

function NormalizeID(value, label)
{
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0)
    {
        throw new TypeError(`Invalid ${label}: ${value}`);
    }
    return id;
}

function NormalizePathSegment(value, label)
{
    const result = String(value || "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(result))
    {
        throw new TypeError(`Invalid ${label}: ${value}`);
    }
    return result;
}

function NormalizeResourcePath(value)
{
    let result = String(value || "").trim().replace(/\\/g, "/").toLowerCase();
    if (result.startsWith("res:/")) result = result.slice(5);

    const segments = result.split("/").filter(Boolean);
    if (segments.some(segment => segment === "." || segment === ".." || segment.includes("\0")))
    {
        throw new TypeError(`Invalid resource path: ${value}`);
    }

    return segments.map(encodeURIComponent).join("/");
}
