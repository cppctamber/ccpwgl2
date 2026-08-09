import { tw2 } from "global";
import { isDNA, isString } from "utils";
import { EveSOFData } from "./EveSOFData";


/**
 * Lazy space object factory data manager.
 *
 * Boots an EveSOFData from the minimum payload (generic.black) and acquires
 * hull/faction/race/material/pattern components on demand from their
 * individual .black files in the resfileindex, instead of loading the whole
 * data.black up front. Registered on the library as the dna handler:
 *
 *      const handler = new EveSOFDataHandler();
 *      tw2.Register({ dnaHandler: handler.handler });
 *      await tw2.Initialize({ ... });
 *
 * All component fetching goes through resMan so `res:/` paths resolve
 * through the registered path prefixes exactly like data.black does today.
 */
export class EveSOFDataHandler
{

    /**
     * The managed sof data instance
     * @type {EveSOFData|null}
     */
    data = null;

    /**
     * In-flight fetch de-duplication, keyed "{section}:{name}"
     * @type {Map<String, Promise>}
     * @private
     */
    _pending = new Map();

    /**
     * Boot promise (generic.black)
     * @type {Promise|null}
     * @private
     */
    _boot = null;

    /**
     * Constructor
     * @param {Object} [options]
     * @param {String} [options.basePath] - space object factory res directory
     * @param {EveSOFData} [options.data] - optional pre-existing sof data
     */
    constructor(options = {})
    {
        if (options.basePath) this.basePath = options.basePath;
        if (options.data) this.data = options.data;
    }

    /**
     * Space object factory res directory
     * @type {String}
     */
    basePath = "res:/dx9/model/spaceobjectfactory";

    /**
     * The dna handler function for tw2.Register({ dnaHandler }).
     * Called with null at Initialize (boot), or with a dna string per build.
     * @returns {Function} async (dna|null) => EveSOFData
     */
    get handler()
    {
        return (dna) => this.Handle(dna);
    }

    /**
     * Resolves a dna request to a build-ready EveSOFData instance.
     * @param {String|null} dna
     * @returns {Promise<EveSOFData>}
     */
    async Handle(dna)
    {
        await this.EnsureBoot();
        if (dna) await this.EnsureFromDNA(dna);
        return this.data;
    }

    /**
     * Ensures the minimum boot payload (generic.black) is loaded.
     * @returns {Promise<EveSOFData>}
     */
    async EnsureBoot()
    {
        if (!this._boot)
        {
            this._boot = (async () =>
            {
                if (!this.data) this.data = new EveSOFData();
                if (!this.data.generic)
                {
                    this.data.generic = await tw2.resMan.FetchObject(`${this.basePath}/generic.black`);
                }
                return this.data;
            })();
        }
        return this._boot;
    }

    /**
     * Ensures every component a dna needs is present, including the
     * dependency closure (faction/race referenced materials, faction
     * default pattern).
     * @param {String} dna
     * @returns {Promise<EveSOFData>}
     */
    async EnsureFromDNA(dna)
    {
        const names = this.constructor.ParseDnaNames(dna);

        const [ , faction, race ] = await Promise.all([
            this.FetchHull(names.hull),
            this.FetchFaction(names.faction),
            this.FetchRace(names.race)
        ]);

        // Components referenced by the fetched components themselves
        const materials = new Set(names.materials);
        const patterns = new Set(names.patterns);
        this.constructor.CollectMaterialNames(faction, materials);
        this.constructor.CollectMaterialNames(race, materials);
        if (faction && faction.defaultPatternName) patterns.add(faction.defaultPatternName);

        await Promise.all([
            ...Array.from(materials, (name) => this.FetchMaterial(name).catch((err) =>
            {
                tw2.Warning({ type: "Space Object Factory", message: `Could not fetch sof material ${name}: ${err.message}` });
            })),
            ...Array.from(patterns, (name) => this.FetchPattern(name).catch((err) =>
            {
                tw2.Warning({ type: "Space Object Factory", message: `Could not fetch sof pattern ${name}: ${err.message}` });
            }))
        ]);

        return this.data;
    }

    /**
     * Adds a hull, deduped by name
     * @param {*} object
     * @param {Boolean} [force] - replace an existing same-name entry
     */
    AddHull(object, force) { return this._Add("hull", object, force); }

    /** Adds a faction, deduped by name */
    AddFaction(object, force) { return this._Add("faction", object, force); }

    /** Adds a race, deduped by name */
    AddRace(object, force) { return this._Add("race", object, force); }

    /** Adds a material, deduped by name */
    AddMaterial(object, force) { return this._Add("material", object, force); }

    /** Adds a pattern, deduped by name */
    AddPattern(object, force) { return this._Add("pattern", object, force); }

    /** Adds a layout, deduped by name */
    AddLayout(object, force) { return this._Add("layout", object, force); }

    /**
     * Fetches a hull by name or res path, skipping the fetch when present
     * @param {String} nameOrPath
     * @param {Boolean} [force] - fetch and replace even when present
     */
    FetchHull(nameOrPath, force) { return this._Fetch("hull", nameOrPath, force); }

    /** Fetches a faction by name or res path */
    FetchFaction(nameOrPath, force) { return this._Fetch("faction", nameOrPath, force); }

    /** Fetches a race by name or res path */
    FetchRace(nameOrPath, force) { return this._Fetch("race", nameOrPath, force); }

    /** Fetches a material by name or res path */
    FetchMaterial(nameOrPath, force) { return this._Fetch("material", nameOrPath, force); }

    /** Fetches a pattern by name or res path */
    FetchPattern(nameOrPath, force) { return this._Fetch("pattern", nameOrPath, force); }

    /** Fetches a layout by name or res path */
    FetchLayout(nameOrPath, force) { return this._Fetch("layout", nameOrPath, force); }

    /**
     * Inserts a component into the backing list, deduped by name
     * @param {String} section
     * @param {*} object
     * @param {Boolean} [force]
     * @returns {*} the stored component
     * @private
     */
    _Add(section, object, force)
    {
        if (!object || !isString(object.name)) throw new TypeError(`Invalid sof ${section}: missing name`);
        const list = this.data[section];
        const name = object.name.toLowerCase();
        const index = list.findIndex((x) => x.name.toLowerCase() === name);
        if (index === -1)
        {
            list.push(object);
            return object;
        }
        if (!force) return list[index];
        list[index] = object;
        return object;
    }

    /**
     * Fetches a component through resMan and adds it
     * @param {String} section
     * @param {String} nameOrPath
     * @param {Boolean} [force]
     * @returns {Promise<*>} the stored component
     * @private
     */
    async _Fetch(section, nameOrPath, force)
    {
        await this.EnsureBoot();

        const isPath = nameOrPath.includes("/");
        const name = (isPath ? nameOrPath.split("/").pop().replace(/\.black$/i, "") : nameOrPath).toLowerCase();

        if (!force)
        {
            const list = this.data[section];
            const existing = list.find((x) => x.name.toLowerCase() === name);
            if (existing) return existing;
        }

        const key = `${section}:${name}`;
        let pending = this._pending.get(key);
        if (!pending)
        {
            const path = isPath ? nameOrPath : `${this.basePath}/${this.constructor.directories[section]}/${name}.black`;
            pending = tw2.resMan.FetchObject(path)
                .then((object) => this._Add(section, object, force))
                .finally(() => this._pending.delete(key));
            this._pending.set(key, pending);
        }
        return pending;
    }

    /**
     * Extracts component names from a dna string without needing any sof
     * data present (mirrors EveSOFData.ParseDNA's format).
     * @param {String} dna
     * @returns {{ hull: String, faction: String, race: String, materials: Array<String>, patterns: Array<String>, resPathInsert: String|null }}
     */
    static ParseDnaNames(dna)
    {
        if (!isDNA(dna)) throw new TypeError(`Invalid dna: ${dna}`);
        const parts = dna.toLowerCase().split(":");

        const commands = {};
        for (let i = 3; i < parts.length; ++i)
        {
            const subParts = parts[i].split("?");
            if (subParts[1] !== undefined) commands[subParts[0].toUpperCase()] = subParts[1].split(";");
        }

        const materials = [];
        const m = commands["MESH"] || commands["MATERIAL"];
        if (m) for (const name of m) if (name && name !== "none") materials.push(name);

        const patterns = [];
        const p = commands["PATTERN"];
        if (p)
        {
            if (p[0] && p[0] !== "none") patterns.push(p[0]);
            for (let i = 1; i < p.length; i++) if (p[i] && p[i] !== "none") materials.push(p[i]);
        }

        return {
            hull: parts[0],
            faction: parts[1],
            race: parts[2],
            materials,
            patterns,
            resPathInsert: commands["RESPATHINSERT"] ? commands["RESPATHINSERT"][0] : null
        };
    }

    /**
     * Recursively collects sof material names referenced by a component
     * (faction area materials, default pattern materials, etc.)
     * @param {*} object
     * @param {Set<String>} [out]
     * @param {Number} [depth]
     * @returns {Set<String>}
     */
    static CollectMaterialNames(object, out = new Set(), depth = 0)
    {
        if (!object || typeof object !== "object" || depth > 6) return out;

        if (Array.isArray(object))
        {
            for (const item of object) this.CollectMaterialNames(item, out, depth + 1);
            return out;
        }

        if (ArrayBuffer.isView(object)) return out;

        for (const key of Object.keys(object))
        {
            const value = object[key];
            if (isString(value))
            {
                if (value && this.materialKeyPattern.test(key)) out.add(value.toLowerCase());
            }
            else if (value && typeof value === "object")
            {
                this.CollectMaterialNames(value, out, depth + 1);
            }
        }
        return out;
    }

    /**
     * Property names that carry sof material names
     * @type {RegExp}
     */
    static materialKeyPattern = /^material[0-9]$|^patternMaterial[0-9]$|materialname$/i;

    /**
     * Per-section directory names in the resfileindex
     * @type {Object}
     */
    static directories = {
        hull: "hulls",
        faction: "factions",
        race: "races",
        material: "materials",
        pattern: "patterns",
        layout: "layouts"
    };

}
