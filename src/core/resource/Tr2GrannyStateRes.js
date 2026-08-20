// Source: trinity/trinity/Resources/Tr2GrannyStateRes.h
// Source: trinity/trinity/Resources/Tr2GrannyStateRes.cpp
import { resMan } from "global";
import { meta } from "utils";
import { GsfReader } from "../reader";
import { Tw2Resource } from "./Tw2Resource";


/**
 * Granny character animation state resource.
 *
 * A `.gsf` contains an authored animation state machine, animation slots, and
 * animation sets that reference separate `.gr2` clips. It contains neither
 * render geometry nor a skeleton; those remain owned by the referenced GR2
 * resources.
 *
 * `HasPrepared()` reports that the GSF document was decoded.
 * `IsFullyLoaded()` additionally requires every referenced GR2 to have arrived.
 *
 * @property {Object|null} gsf Projected GSF document.
 * @property {String|null} format Projected document format.
 * @property {Object|null} stateMachine Authored state-machine graph.
 * @property {Array} animationSlots Named animation slots.
 * @property {Array} animationSets Animation sets carrying GR2 references.
 * @property {Array<String>} gsfReferences Resolved, deduplicated GR2 paths.
 */
@meta.type("Tr2GrannyStateRes")
@meta.define({
    wgl: "Tr2GrannyStateRes",
    ccp: "Tr2GrannyStateRes"
})
export class Tr2GrannyStateRes extends Tw2Resource
{

    #animationLoadError = null;
    #animationLoadPromise = Promise.resolve(this);
    #animationResources = new Map();
    #loadGeneration = 0;

    gsf = null;
    format = null;
    stateMachine = null;
    animationSlots = [];
    animationSets = [];
    gsfReferences = [];

    /**
     * Selects the GSF reader and response type.
     *
     * @param {String} _url Resolved request URL.
     * @param {String} extension Requested extension.
     * @returns {Boolean} False so the resource manager performs the request.
     */
    DoCustomLoad(_url, extension)
    {
        if (String(extension).toLowerCase() !== GsfReader.extension)
        {
            throw new TypeError(`Tr2GrannyStateRes cannot load ${JSON.stringify(extension)}`);
        }
        this._requestResponseType = GsfReader.requestResponseType;
        return false;
    }

    /**
     * Projects a GSF document and starts loading its referenced animations.
     *
     * @param {ArrayBuffer|Uint8Array|Object} data GSF bytes or projected data.
     */
    Prepare(data)
    {
        this.Clear();
        GsfReader.Prepare(data, this);
        if (!this.gsf?.stateMachine || !this.stateMachine)
        {
            throw new TypeError("Tr2GrannyStateRes expected a GSF stateMachine");
        }
        if (!Array.isArray(this.animationSets))
        {
            throw new TypeError("Tr2GrannyStateRes expected animationSets to be an array");
        }

        this.gsfReferences = this.GetGStateAnimFileRefPaths();
        this.#BeginAnimationLoads();
        this.OnPrepared();
    }

    /**
     * Loads projected or raw GSF input through the normal resource preparation path.
     *
     * @param {ArrayBuffer|Uint8Array|Object} data GSF bytes or projected data.
     * @returns {Tr2GrannyStateRes} This resource.
     */
    DoLoad(data)
    {
        this.Prepare(data);
        return this;
    }

    /** Clears the projected document and attached animation references. */
    Clear()
    {
        this.#loadGeneration++;
        this.#animationLoadError = null;
        this.#animationLoadPromise = Promise.resolve(this);
        this.#animationResources.clear();
        this.gsf = null;
        this.format = null;
        this.stateMachine = null;
        this.animationSlots = [];
        this.animationSets = [];
        this.gsfReferences = [];
    }

    /**
     * Releases this resource's document and reference table.
     *
     * GR2 resources remain owned and cached by the resource manager.
     *
     * @param {*} [log] Resource lifecycle log data.
     * @returns {Boolean} True when unloaded.
     */
    Unload(log)
    {
        this.Clear();
        this.OnUnloaded(log);
        return true;
    }

    /** @returns {Object|null} Authored state-machine graph. */
    GetStateMachine()
    {
        return this.stateMachine;
    }

    /** @returns {Array} Named animation slots. */
    GetAnimationSlots()
    {
        return this.animationSlots;
    }

    /** @returns {Array} Animation sets carrying external clip references. */
    GetAnimationSets()
    {
        return this.animationSets;
    }

    /** @returns {Object|null} Model and retarget hints from the GSF. */
    GetCharacterInfo()
    {
        return this.gsf?.character ?? null;
    }

    /**
     * Resolves and deduplicates every animation reference in first-seen order.
     *
     * @returns {Array<String>} Resolved GR2 paths.
     */
    GetGStateAnimFileRefPaths()
    {
        const seen = new Set();
        const result = [];
        for (const set of this.GetAnimationSets())
        {
            for (const reference of (set?.sourceFileReferences || []))
            {
                const path = Tr2GrannyStateRes.ResolveAnimPath(reference, this.path);
                if (!path || seen.has(path)) continue;
                seen.add(path);
                result.push(path);
            }
        }
        return result;
    }

    /**
     * Attaches one loaded animation resource under its resolved path.
     *
     * @param {String} path Resolved GR2 path.
     * @param {*} resource Loaded GR2 resource.
     * @returns {Tr2GrannyStateRes} This resource.
     */
    SetAnimationResource(path, resource)
    {
        this.#animationResources.set(NormalizeSeparators(path), resource);
        return this;
    }

    /**
     * Gets one attached animation resource.
     *
     * @param {String} path Resolved GR2 path.
     * @returns {*} Loaded resource or null.
     */
    GetAnimationResource(path)
    {
        return this.#animationResources.get(NormalizeSeparators(path)) ?? null;
    }

    /**
     * Reports whether the GSF and every referenced animation are available.
     *
     * @returns {Boolean}
     */
    IsFullyLoaded()
    {
        return !!this.gsf && !this.#animationLoadError &&
            this.GetGStateAnimFileRefPaths().every(path => this.#animationResources.has(path));
    }

    /**
     * Waits for every automatically requested animation resource.
     *
     * @returns {Promise<Tr2GrannyStateRes>} This resource after all clips arrive.
     */
    async WaitForAnimationResources()
    {
        await this.#animationLoadPromise;
        if (this.#animationLoadError) throw this.#animationLoadError;
        return this;
    }

    /** Starts one generation of deduplicated external animation requests. */
    #BeginAnimationLoads()
    {
        const generation = this.#loadGeneration;
        this.#animationLoadPromise = Promise.all(this.gsfReferences.map(async path =>
        {
            const resource = await resMan.FetchResource(path);
            if (!resource)
            {
                throw new Error(`Tr2GrannyStateRes could not load ${path}`);
            }
            if (generation === this.#loadGeneration)
            {
                this.SetAnimationResource(path, resource);
            }
        })).then(() => this).catch(error =>
        {
            if (generation === this.#loadGeneration)
            {
                this.#animationLoadError = error;
                this.OnError(error);
            }
            return this;
        });
    }

    /**
     * Resolves one authored animation reference against its owning GSF path.
     *
     * Leading `../` segments walk parent directories. Matching the separator
     * avoids corrupting a legitimate file such as `..oddname.gr2`, unlike
     * Carbon's broader two-dot prefix check.
     *
     * @param {String} reference Authored reference.
     * @param {String} owner Owning GSF path.
     * @returns {String} Resolved resource path.
     */
    static ResolveAnimPath(reference, owner)
    {
        let value = NormalizeSeparators(reference);
        if (!value) return "";
        if (/^[a-z]+:\//iu.test(value)) return value;

        let directory = NormalizeSeparators(owner);
        const cut = directory.lastIndexOf("/");
        directory = cut === -1 ? "" : directory.slice(0, cut);

        while (value.startsWith("../"))
        {
            value = value.slice(3);
            const up = directory.lastIndexOf("/");
            directory = up === -1 ? "" : directory.slice(0, up);
        }
        if (value.startsWith("./")) value = value.slice(2);
        return directory ? `${directory}/${value}` : value;
    }

    static extension = "gsf";

}


function NormalizeSeparators(value)
{
    return String(value || "").replace(/\\/gu, "/");
}
