import { meta } from "utils";
import { resMan } from "global";


@meta.define("TnySDEApiProvider")
export class TnySDEApiProvider
{

    root = "res:/static";
    fetcher = null;
    typeProvider = null;
    cache = new Map();

    constructor(options = {})
    {
        if (options.root) this.root = options.root;
        if (options.fetcher) this.fetcher = options.fetcher;
        if (options.typeProvider) this.typeProvider = options.typeProvider;
        if (options.cache) this.cache = options.cache;
    }

    /**
     * Empties the response cache.
     * @returns {TnySDEApiProvider}
     */
    ClearCache()
    {
        this.cache.clear();
        return this;
    }

    /**
     * The provider consulted for type-level answers this one does not hold.
     * @param {Object} provider
     * @returns {TnySDEApiProvider}
     */
    SetTypeProvider(provider)
    {
        this.typeProvider = provider || null;
        return this;
    }

    /**
     * @param {String} path
     * @returns {String}
     */
    BuildPath(path)
    {
        if (!path)
        {
            throw new Error("Invalid SDE path");
        }

        return `${this.root}/${path}`;
    }

    /**
     * @param {String} path
     * @returns {String}
     */
    BuildUrl(path)
    {
        return resMan.BuildUrl(this.BuildPath(path));
    }

    /**
     * Fetches json, answering `fallback` rather than throwing when the record
     * is absent. Static data is patchy by nature, so a miss is ordinary.
     * @param {String} path
     * @param {*} [fallback]
     * @returns {Promise<*>}
     */
    FetchJSON(path, fallback)
    {
        const url = this.BuildUrl(path);

        if (!this.cache.has(url))
        {
            const fetcher = this.fetcher || resMan.FetchRaw.bind(resMan);
            let result = Promise.resolve(fetcher(url, "json"));

            if (fallback !== undefined)
            {
                result = result.catch(err => fallback);
            }

            this.cache.set(url, result);
        }

        return this.cache.get(url);
    }

    /**
     * @param {Number} skinID
     * @returns {Promise<TnySkin>}
     */
    GetSkin(skinID)
    {
        return this.FetchJSON(`skins/${skinID}`);
    }

    /**
     * @param {Number} skinMaterialID
     * @returns {Promise<TnySkinMaterial>}
     */
    GetSkinMaterial(skinMaterialID)
    {
        return this.FetchJSON(`skinMaterials/${skinMaterialID}`);
    }

    /**
     * @param {Number} materialSetID
     * @returns {Promise<TnySkinMaterialSet>}
     */
    GetSkinMaterialSet(materialSetID)
    {
        return this.FetchJSON(`skinMaterialSets/${materialSetID}`);
    }

    /**
     * @param {Number} skinMaterialID
     * @returns {Promise<Array<Number>>}
     */
    GetSkinMaterialTypeIDs(skinMaterialID)
    {
        return this.FetchJSON(`skinMaterialsToTypes/${skinMaterialID}`, []);
    }

    /**
     * @param {Number} typeID
     * @returns {Promise<Array<Number>>}
     */
    GetTypeIDSkinIDs(typeID)
    {
        return this.FetchJSON(`typesToSkins/${typeID}`, []);
    }

    /**
     * @param {Number} moonID
     * @returns {Promise<TnyCelestial>} SDE spelling, which may be snake_case
     */
    GetMoon(moonID)
    {
        return this.FetchJSON(`moons/${moonID}`, {});
    }

    /**
     * @param {Number} planetID
     * @returns {Promise<TnyCelestial>} SDE spelling, which may be snake_case
     */
    GetPlanet(planetID)
    {
        return this.FetchJSON(`planets/${planetID}`, {});
    }

    /**
     * Walks skin to material to material set in one call.
     * @param {Number} skinID
     * @returns {Promise<TnySkinMaterialSet>}
     */
    async GetSkinMaterialSetFromSkinID(skinID)
    {
        const skin = await this.GetSkin(skinID),
            skinMaterialID = this.constructor.GetFirst(skin, "skinMaterialID", "skin_material_id"),
            material = await this.GetSkinMaterial(skinMaterialID),
            materialSetID = this.constructor.GetFirst(material, "materialSetID", "material_set_id");

        return this.GetSkinMaterialSet(materialSetID);
    }

    /**
     * @param {Number} typeID
     * @param {Number} skinID
     * @returns {Promise<String>} the skinned dna
     */
    async GetResPathFromTypeIDAndSkinID(typeID, skinID)
    {
        const skin = await this.GetSkin(skinID),
            skinMaterialID = this.constructor.GetFirst(skin, "skinMaterialID", "skin_material_id"),
            internalName = this.constructor.GetFirst(skin, "internalName", "internal_name");

        return this.GetResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID, internalName);
    }

    /**
     * As above, entering from the material rather than the skin.
     * @param {Number} typeID
     * @param {Number} skinMaterialID
     * @param {String} [name]
     * @returns {Promise<String>} the skinned dna
     */
    async GetResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID, name)
    {
        const dna = await this.GetTypeResPath(typeID),
            material = await this.GetSkinMaterial(skinMaterialID),
            materialSetID = this.constructor.GetFirst(material, "materialSetID", "material_set_id"),
            set = await this.GetSkinMaterialSet(materialSetID);

        return this.constructor.BuildSkinDNA(dna, set, name);
    }

    /**
     * @param {Number} typeID
     * @returns {Promise<String>} the type's unskinned dna or path
     */
    GetTypeResPath(typeID)
    {
        if (this.typeProvider && this.typeProvider.GetResPathFromTypeID)
        {
            return this.typeProvider.GetResPathFromTypeID(typeID);
        }

        throw new Error("TnySDEApiProvider requires a typeProvider with GetResPathFromTypeID(...)");
    }

    /**
     * Rewrites a base dna with a material set applied.
     *
     * Every absent field of the set becomes "none" rather than being dropped,
     * so a partial set produces a different dna instead of an error.
     *
     * @param {String} dna - the base dna
     * @param {TnySkinMaterialSet} set
     * @param {String} [name]
     * @returns {Object} { name, dna }
     * @throws {Error} when the base dna has fewer than three parts
     */
    static BuildSkinDNA(dna, set, name)
    {
        const description = this.GetFirst(set, "description") || "";
        name = name || description.split("(")[0];

        const
            parts = dna.split(":"),
            commands = {};

        for (let i = 3; i < parts.length; ++i)
        {
            const subParts = parts[i].split("?");
            if (subParts.length !== 2)
            {
                throw new Error(`Invalid SOF DNA format: ${dna}`);
            }

            commands[subParts[0].toUpperCase()] = subParts[1].split(";");
        }

        const hull = parts[0],
            faction = this.GetFirst(set, "sof_faction_name", "sofFactionName") || parts[1],
            race = parts[2];

        let mesh = commands.MESH || commands.MATERIAL,
            pattern = commands.PATTERN,
            resPathInsert = this.GetFirst(set, "res_path_insert", "resPathInsert") || commands.RESPATHINSERT;

        if (Array.isArray(resPathInsert))
        {
            resPathInsert = resPathInsert[0];
        }

        const sofPatternName = this.GetFirst(set, "sof_pattern_name", "sofPatternName"),
            patternMaterial1 = this.GetFirst(set, "pattern_material_1", "patternMaterial1"),
            patternMaterial2 = this.GetFirst(set, "pattern_material_2", "patternMaterial2");

        if (sofPatternName || patternMaterial1 || patternMaterial2)
        {
            pattern = [
                sofPatternName || "none",
                patternMaterial1 || "none",
                patternMaterial2 || "none"
            ];
        }

        const material1 = this.GetFirst(set, "material_1", "material1"),
            material2 = this.GetFirst(set, "material_2", "material2"),
            material3 = this.GetFirst(set, "material_3", "material3"),
            material4 = this.GetFirst(set, "material_4", "material4");

        if (material1 || material2 || material3 || material4)
        {
            mesh = [
                material1 || "none",
                material2 || "none",
                material3 || "none",
                material4 || "none"
            ];
        }

        let sof = `${hull}:${faction}:${race}`;
        if (mesh) sof += `:material?${mesh.join(";")}`;
        if (pattern) sof += `:pattern?${pattern.join(";")}`;

        if (resPathInsert && resPathInsert.toLowerCase() !== "none")
        {
            sof += `:respathinsert?${resPathInsert}`;
        }

        return { name, dna: sof.toLowerCase() };
    }

    /**
     * The first of several spellings a record actually carries, so camelCase
     * and snake_case answers both read.
     * @param {Object} item
     * @param {...String} names
     * @returns {*} null when none are present
     */
    static GetFirst(item, ...names)
    {
        for (let i = 0; i < names.length; i++)
        {
            const name = names[i];
            if (item && item[name] !== undefined)
            {
                return item[name];
            }
        }

        return undefined;
    }

}
