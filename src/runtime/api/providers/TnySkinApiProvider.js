import { meta } from "utils";
import { TnyGeneratedLibraryProvider } from "./TnyGeneratedLibraryProvider";


@meta.tny.type("TnySkinApiProvider")
@meta.tny.define("TnySkinApiProvider")
export class TnySkinApiProvider extends TnyGeneratedLibraryProvider
{

    skinUrl = null;
    skinrUrl = null;
    apiRoot = null;
    apiFetcher = null;
    apiProvider = null;
    apiCache = new Map();
    unavailableLibraryUrls = new Set();
    typeProvider = null;

    constructor(options = {})
    {
        super(options);

        if (options.hasOwnProperty("skinUrl")) this.skinUrl = options.skinUrl;
        if (options.hasOwnProperty("skinrUrl")) this.skinrUrl = options.skinrUrl;
        if (options.toolsService)
        {
            this.SetToolsService(options.toolsService, options);
        }
        if (options.apiRoot) this.apiRoot = String(options.apiRoot).replace(/\/+$/, "");
        if (options.apiFetcher) this.apiFetcher = options.apiFetcher;
        if (options.apiProvider) this.apiProvider = options.apiProvider;
        if (options.apiCache) this.apiCache = options.apiCache;
        if (options.typeProvider) this.typeProvider = options.typeProvider;
    }

    ClearCache()
    {
        super.ClearCache();
        this.apiCache.clear();
        this.unavailableLibraryUrls.clear();
        return this;
    }

    SetTypeProvider(provider)
    {
        this.typeProvider = provider || null;
        return this;
    }

    SetToolsService(bootstrap, options = {})
    {
        this.apiRoot = this.constructor.BuildToolsServiceRoot(bootstrap, options);
        return this;
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

    async GetSkinLibrary()
    {
        const library = await this.TryGetLibrary(this.skinUrl);
        if (library) return library;
        if (this.apiRoot) return this.FetchApiJSON("skin");
        return this.RequestApiProvider("GetSkinLibrary");
    }

    async GetSkinrLibrary()
    {
        const library = await this.TryGetLibrary(this.skinrUrl);
        if (library) return library;
        if (this.apiRoot) return this.FetchApiJSON("skinr");
        return this.RequestApiProvider("GetSkinrLibrary");
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

        throw new Error(`TnySkinApiProvider API method not found: ${method}`);
    }

    BuildApiUrl(path, query)
    {
        if (!this.apiRoot)
        {
            throw new Error("TnySkinApiProvider has no generated-library asset or API root");
        }

        let url = `${this.apiRoot}/${String(path).replace(/^\/+/, "")}`;
        const keys = Object.keys(query || {}).sort();

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
            throw new TypeError(`Skin API ${url} returned no data`);
        }

        return value;
    }

    async GetSkin(skinID)
    {
        const library = await this.TryGetLibrary(this.skinUrl);
        if (library) return RequireRecord(library.skins, skinID, "SKIN");
        if (this.apiRoot) return this.FetchApiJSON(`skin/skins/${encodeURIComponent(skinID)}`);
        return this.RequestApiProvider("GetSkin", skinID);
    }

    async GetSkinMaterial(skinMaterialID)
    {
        const library = await this.TryGetLibrary(this.skinUrl);
        if (library)
        {
            return RequireRecord(library.skinMaterials, skinMaterialID, "SKIN material");
        }
        if (this.apiRoot)
        {
            return this.FetchApiJSON(`skin/skinMaterials/${encodeURIComponent(skinMaterialID)}`);
        }
        return this.RequestApiProvider("GetSkinMaterial", skinMaterialID);
    }

    async GetSkinMaterialSet(materialSetID)
    {
        const library = await this.TryGetLibrary(this.skinUrl);
        if (library)
        {
            return RequireRecord(library.skinMaterialSets, materialSetID, "SKIN material set");
        }
        if (this.apiRoot)
        {
            return this.FetchApiJSON(`skin/skinMaterialSets/${encodeURIComponent(materialSetID)}`);
        }
        return this.RequestApiProvider("GetSkinMaterialSet", materialSetID);
    }

    async GetSkinMaterialTypeIDs(skinMaterialID)
    {
        const library = await this.TryGetLibrary(this.skinUrl);
        if (library) return (library.skinMaterialsToTypes[skinMaterialID] || []).slice();
        if (this.apiRoot)
        {
            return this.FetchApiJSON(`skin/skinMaterialsToTypes/${encodeURIComponent(skinMaterialID)}`);
        }
        return this.RequestApiProvider("GetSkinMaterialTypeIDs", skinMaterialID);
    }

    async GetTypeIDSkinIDs(typeID)
    {
        const library = await this.TryGetLibrary(this.skinUrl);
        if (library) return (library.typesToSkins[typeID] || []).slice();
        if (this.apiRoot)
        {
            return this.FetchApiJSON(`skin/typesToSkins/${encodeURIComponent(typeID)}`);
        }
        return this.RequestApiProvider("GetTypeIDSkinIDs", typeID);
    }

    async GetSkinr(section, id)
    {
        const library = await this.TryGetLibrary(this.skinrUrl);

        if (library)
        {
            if (section === undefined || section === null)
            {
                return library;
            }

            const records = RequireRecord(library, section, "SKINR section");
            return id === undefined || id === null
                ? records
                : RequireRecord(records, id, `SKINR ${section}`);
        }

        let path = "skinr";
        if (section !== undefined && section !== null)
        {
            path += `/${encodeURIComponent(section)}`;
        }
        if (id !== undefined && id !== null)
        {
            path += `/${encodeURIComponent(id)}`;
        }
        return this.apiRoot
            ? this.FetchApiJSON(path)
            : this.RequestApiProvider("GetSkinr", section, id);
    }

    async LookupName(name)
    {
        const library = await this.TryGetLibrary(this.skinUrl);
        if (library) return (library.names[NormalizeName(name)] || []).slice();
        return this.apiRoot
            ? this.FetchApiJSON("skin/lookup", { name })
            : this.RequestApiProvider("LookupName", name);
    }

    async SearchName(name)
    {
        const library = await this.TryGetLibrary(this.skinUrl);

        if (!library)
        {
            return this.apiRoot
                ? this.FetchApiJSON("skin/search", { name })
                : this.RequestApiProvider("SearchName", name);
        }

        const expected = NormalizeSearchName(name),
            candidates = new Map();

        for (const candidateName in library.names)
        {
            if (!library.names.hasOwnProperty(candidateName)
                || NormalizeSearchName(candidateName) !== expected)
            {
                continue;
            }

            const values = library.names[candidateName];
            for (let i = 0; i < values.length; i++)
            {
                const value = values[i],
                    key = `${value.kind}:${value.typeID}:${value.skinID === null ? "" : value.skinID}`;
                candidates.set(key, value);
            }
        }

        return [ ...candidates.values() ].sort(CompareCandidates);
    }

    async ResolveTypeDna(typeID)
    {
        if (!this.typeProvider || !this.typeProvider.ResolveTypeDna)
        {
            throw new Error("TnySkinApiProvider requires a type provider with ResolveTypeDna(...)");
        }

        return this.typeProvider.ResolveTypeDna(typeID);
    }

    async ResolveSkinDna(typeID, skinID)
    {
        const skin = await this.GetSkin(skinID),
            normalizedTypeID = Number(typeID);

        if (!skin.types.includes(normalizedTypeID))
        {
            throw new Error(`SKIN ${skinID} is not valid for type ${typeID}`);
        }

        const material = await this.GetSkinMaterial(skin.skinMaterialID),
            set = await this.GetSkinMaterialSet(material.materialSetID),
            base = await this.ResolveTypeDna(normalizedTypeID),
            resolved = BuildSkinDna(base.dna, set, skin.internalName);

        return {
            ...base,
            ...resolved,
            skinID: Number(skinID),
            skinMaterialID: skin.skinMaterialID,
            materialSetID: material.materialSetID
        };
    }

    ResolveDna(selection)
    {
        if (!selection || selection.typeID === undefined || selection.typeID === null)
        {
            throw new TypeError("DNA resolution requires typeID");
        }

        return selection.skinID === undefined || selection.skinID === null
            ? this.ResolveTypeDna(selection.typeID)
            : this.ResolveSkinDna(selection.typeID, selection.skinID);
    }

}

function RequireRecord(records, id, label)
{
    const record = records && records[id];

    if (!record)
    {
        throw new ReferenceError(`${label} ${id} not found`);
    }

    return record;
}

function NormalizeName(value)
{
    const name = String(value || "").trim().toLocaleLowerCase("en-US");

    if (!name)
    {
        throw new TypeError("Name lookup requires a non-empty name");
    }

    return name;
}

function NormalizeSearchName(value)
{
    return NormalizeName(value)
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .replace(/\s+/gu, " ");
}

function CompareCandidates(left, right)
{
    return String(left.kind).localeCompare(String(right.kind), "en")
        || Number(left.typeID) - Number(right.typeID)
        || Number(left.skinID === null ? -1 : left.skinID)
            - Number(right.skinID === null ? -1 : right.skinID);
}

function BuildSkinDna(dna, set, name)
{
    const description = set.description || "",
        parts = String(dna || "").split(":");

    if (parts.length < 3)
    {
        throw new Error(`Invalid SOF DNA format: ${dna}`);
    }

    const commands = ParseDnaCommands(parts.slice(3), dna),
        mesh = [ set.material1, set.material2, set.material3, set.material4 ]
            .map(NormalizeMaterial),
        pattern = [ set.sofPatternName, set.patternMaterial1, set.patternMaterial2 ]
            .map(NormalizeMaterial),
        insert = NormalizeOptionalText(set.resPathInsert || commands.RESPATHINSERT?.[0]),
        result = [ `${parts[0]}:${set.sofFactionName || parts[1]}:${parts[2]}` ];

    if (mesh.some(value => value !== "none"))
    {
        result.push(`mesh?${mesh.join(";")}`);
    }

    if (pattern.some(value => value !== "none"))
    {
        result.push(`pattern?${pattern.join(";")}`);
    }

    if (insert)
    {
        result.push(`respathinsert?${insert}`);
    }

    return {
        name: name || description.split("(")[0].trim() || null,
        dna: result.join(":").toLowerCase()
    };
}

function ParseDnaCommands(parts, dna)
{
    const commands = {};

    for (let i = 0; i < parts.length; i++)
    {
        const part = parts[i],
            separator = part.indexOf("?");

        if (separator <= 0 || separator === part.length - 1)
        {
            throw new Error(`Invalid SOF DNA format: ${dna}`);
        }

        commands[part.slice(0, separator).toUpperCase()] = part
            .slice(separator + 1)
            .split(";");
    }

    return commands;
}

function NormalizeOptionalText(value)
{
    const text = String(value ?? "").trim();
    return text && text.toLowerCase() !== "none" ? text : null;
}

function NormalizeMaterial(value)
{
    return NormalizeOptionalText(value) || "none";
}
