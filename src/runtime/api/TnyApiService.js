import { meta } from "utils";


/**
 * The api service is what answers "what does this id refer to".
 *
 * ccpwgl draws from graphics facts - sof dna and resource paths. Ids are not
 * graphics facts, so anything that starts from one has to be resolved first,
 * and that resolution is not the library's job. This service is the seam:
 * supply one that answers the shapes below and every id form works; supply
 * nothing and dna and resource paths still work on their own.
 *
 * No particular server is assumed. The shipped providers speak an ESI-shaped
 * and an SDE-shaped api because that is what exists, but a consumer is free to
 * answer these from a database, a static json file, or a fixture.
 *
 * The contract in full, including the provider slots and the fields a service
 * may answer in more than one shape, is `docs/contracts/tny-api-service.md` in
 * the organisation docs. The typedefs here cover what the RUNTIME itself
 * consumes, which is the subset that has to be right for `scene.Fetch` to work.
 */

/**
 * What `ResolveDna` gives back for a typeID.
 *
 * Consumed by `TnySpaceObject.resolve`, which uses `name` only when the caller
 * did not supply one.
 *
 * @typedef {Object} TnyDnaResolution
 * @property {String} dna    - a sof dna string
 * @property {String} [name] - a display name for the resolved type
 */

/**
 * What `GenerateSkinrDna` and `GenerateSkinrDnaFromId` give back.
 *
 * `pattern` MUST arrive with the design rather than be fetched afterwards: sof
 * resolves pattern names while building, so a pattern registered late draws as
 * an unpatterned hull, which reads as the skin failing rather than as a
 * missing registration.
 *
 * `blendMode` cannot ride along in the dna, because Carbon compiles it in as a
 * permutation. Left out, a design falls back to overlay on the dx11 path while
 * gles2 - which reads it from a constant buffer - looks right, and the two
 * profiles disagree over one design.
 *
 * @typedef {Object} TnySkinrDesign
 * @property {String} dna         - a sof dna string
 * @property {String} [name]      - the design's name
 * @property {String} [blendMode] - a Carbon permutation blend mode name
 * @property {Object} [pattern]   - a skinrSofPattern document, hydrated by the provider
 */

/**
 * What `GetGraphic` gives back for a graphicID.
 *
 * @typedef {Object} TnyGraphic
 * @property {String} graphicFile - a resource path, `.red` or `.black`
 */

/**
 * What `GetPlanet` and `GetMoon` give back for a celestial id.
 *
 * Every field may sit either at the top level or under `attributes`, and in
 * either camelCase or snake_case - the runtime reads both, because an
 * ESI-shaped answer and an SDE-shaped answer disagree about which. See
 * `GetAttribute` in `TnyPlanet.js`.
 *
 * The three graphic fields are graphicIDs, not paths: they are resolved
 * through `GetGraphic` to reach a `graphicFile`.
 *
 * @typedef {Object} TnyCelestial
 * @property {Number} [radius]                     - metres
 * @property {String} [name]
 * @property {Number} [shaderPreset|shader_preset] - graphicID of the surface shader
 * @property {Number} [heightMap1|height_map_1]    - graphicID
 * @property {Number} [heightMap2|height_map_2]    - graphicID
 */


@meta.define("TnyApiService")
export class TnyApiService extends meta.Model
{

    esi = null;
    sde = null;
    skin = null;
    skinr = null;
    characterLibrary = null;
    tools = null;
    providers = [];

    constructor(options = {})
    {
        super();

        const esi = options.esi || options.esiProvider,
            sde = options.sde || options.sdeProvider,
            skin = options.skin || options.skinProvider,
            skinr = options.skinr || options.skinrProvider,
            characterLibrary = options.characterLibrary || options.characterProvider,
            tools = options.tools || options.toolsProvider;

        if (esi)
        {
            this.SetESIProvider(esi);
        }

        if (sde)
        {
            this.SetSDEProvider(sde);
        }

        if (skin)
        {
            this.SetSkinProvider(skin);
        }

        if (skinr)
        {
            this.SetSkinrProvider(skinr);
        }

        if (characterLibrary)
        {
            this.SetCharacterProvider(characterLibrary);
        }

        if (tools)
        {
            this.SetToolsProvider(tools);
        }

        const providers = options.providers || options.provider;
        if (providers)
        {
            this.Use(providers);
        }
    }

    SetProvider(name, provider)
    {
        if (!name)
        {
            throw new TypeError("Invalid api provider name");
        }

        this[name] = provider || null;

        if ([ "esi", "sde", "skin", "skinr", "characterLibrary", "tools" ].includes(name))
        {
            this.LinkProviders();
        }

        return this;
    }

    GetProvider(name)
    {
        return name ? this[name] || null : null;
    }

    SetESIProvider(provider)
    {
        return this.SetProvider("esi", provider);
    }

    GetESIProvider()
    {
        return this.GetProvider("esi");
    }

    SetSDEProvider(provider)
    {
        return this.SetProvider("sde", provider);
    }

    GetSDEProvider()
    {
        return this.GetProvider("sde");
    }

    SetSkinProvider(provider)
    {
        return this.SetProvider("skin", provider);
    }

    GetSkinProvider()
    {
        return this.GetProvider("skin");
    }

    SetSkinrProvider(provider)
    {
        return this.SetProvider("skinr", provider);
    }

    GetSkinrProvider()
    {
        return this.GetProvider("skinr");
    }

    SetCharacterProvider(provider)
    {
        return this.SetProvider("characterLibrary", provider);
    }

    GetCharacterProvider()
    {
        return this.GetProvider("characterLibrary");
    }

    SetToolsProvider(provider)
    {
        return this.SetProvider("tools", provider);
    }

    GetToolsProvider()
    {
        return this.GetProvider("tools");
    }

    LinkProviders()
    {
        if (this.sde && this.esi && this.sde.SetTypeProvider && !this.sde.typeProvider)
        {
            this.sde.SetTypeProvider(this.esi);
        }

        if (this.skin && this.esi && this.skin.SetTypeProvider && !this.skin.typeProvider)
        {
            this.skin.SetTypeProvider(this.esi);
        }

        return this;
    }

    Use(provider)
    {
        if (Array.isArray(provider))
        {
            for (let i = 0; i < provider.length; i++)
            {
                this.Use(provider[i]);
            }
            return this;
        }

        if (!provider)
        {
            throw new TypeError("Invalid api provider");
        }

        if (!this.providers.includes(provider))
        {
            this.providers.push(provider);
        }

        return this;
    }

    Remove(provider)
    {
        const index = this.providers.indexOf(provider);
        if (index !== -1)
        {
            this.providers.splice(index, 1);
        }
        return this;
    }

    GetProviders(out = [])
    {
        out.push(...this.providers);
        return out;
    }

    ClearProviders()
    {
        this.providers.splice(0);
        return this;
    }

    Clear()
    {
        this.esi = null;
        this.sde = null;
        this.skin = null;
        this.characterLibrary = null;
        this.tools = null;
        return this.ClearProviders();
    }

    RequestFrom(providerName, method, ...args)
    {
        const provider = this.GetProvider(providerName);
        if (provider && provider[method])
        {
            return provider[method](...args);
        }

        throw new Error(`TnyApiService ${providerName} provider method not found: ${method}`);
    }

    async Request(method, ...args)
    {
        for (let i = 0; i < this.providers.length; i++)
        {
            const provider = this.providers[i];
            if (provider && provider[method])
            {
                return provider[method](...args);
            }
        }

        throw new Error(`TnyApiService provider method not found: ${method}`);
    }

    ClearCache()
    {
        if (this.esi && this.esi.ClearCache)
        {
            this.esi.ClearCache();
        }

        if (this.sde && this.sde.ClearCache)
        {
            this.sde.ClearCache();
        }

        if (this.skin && this.skin.ClearCache)
        {
            this.skin.ClearCache();
        }

        if (this.characterLibrary && this.characterLibrary.ClearCache)
        {
            this.characterLibrary.ClearCache();
        }

        if (this.tools && this.tools.ClearCache)
        {
            this.tools.ClearCache();
        }

        for (let i = 0; i < this.providers.length; i++)
        {
            const provider = this.providers[i];
            if (provider && provider.ClearCache)
            {
                provider.ClearCache();
            }
        }
        return this;
    }

    GetCharacter(...args)
    {
        return this.RequestFrom("esi", "GetCharacter", ...args);
    }

    GetCharacterPortraits(...args)
    {
        return this.RequestFrom("esi", "GetCharacterPortraits", ...args);
    }

    GetCharacterLibrary(...args)
    {
        return this.RequestFrom("characterLibrary", "GetCharacterLibrary", ...args);
    }

    LookupCharacterName(...args)
    {
        return this.RequestFrom("characterLibrary", "LookupCharacterName", ...args);
    }

    SearchCharacterName(...args)
    {
        return this.RequestFrom("characterLibrary", "SearchCharacterName", ...args);
    }

    ResolveCharacterName(...args)
    {
        return this.RequestFrom("characterLibrary", "ResolveCharacterName", ...args);
    }

    GetCharacterPartByTypeID(...args)
    {
        return this.RequestFrom("characterLibrary", "GetCharacterPartByTypeID", ...args);
    }

    GetCharacterPartsByCategory(...args)
    {
        return this.RequestFrom("characterLibrary", "GetCharacterPartsByCategory", ...args);
    }

    GetCorporation(...args)
    {
        return this.RequestFrom("esi", "GetCorporation", ...args);
    }

    GetCorporationLogos(...args)
    {
        return this.RequestFrom("esi", "GetCorporationLogos", ...args);
    }

    GetAlliance(...args)
    {
        return this.RequestFrom("esi", "GetAlliance", ...args);
    }

    GetAllianceLogos(...args)
    {
        return this.RequestFrom("esi", "GetAllianceLogos", ...args);
    }

    GetType(...args)
    {
        return this.RequestFrom("esi", "GetType", ...args);
    }

    GetCategory(...args)
    {
        return this.RequestFrom("esi", "GetCategory", ...args);
    }

    GetGroup(...args)
    {
        return this.RequestFrom("esi", "GetGroup", ...args);
    }

    GetMarketGroup(...args)
    {
        return this.RequestFrom("esi", "GetMarketGroup", ...args);
    }

    /**
     * @param {Number} graphicID
     * @returns {Promise<TnyGraphic>}
     */
    GetGraphic(...args)
    {
        return this.RequestFrom("esi", "GetGraphic", ...args);
    }

    /**
     * Resolves a graphicID to either sof dna or a resource path.
     *
     * The graphicIDs that answer with a PATH are the non-sof family - scenes,
     * suns, planets, moons, lensflares - which is why `TnySpaceObject.resolve`
     * has to test what came back rather than assume dna.
     *
     * @param {Number} graphicID
     * @returns {Promise<String>} sof dna, or a resource path
     */
    GetResPathFromGraphicID(...args)
    {
        return this.RequestFrom("esi", "GetResPathFromGraphicID", ...args);
    }

    GetResPathFromTypeID(...args)
    {
        return this.RequestFrom("esi", "GetResPathFromTypeID", ...args);
    }

    GetSkin(...args)
    {
        return this.RequestFrom("skin", "GetSkin", ...args);
    }

    GetSkinMaterial(...args)
    {
        return this.RequestFrom("skin", "GetSkinMaterial", ...args);
    }

    GetSkinMaterialSet(...args)
    {
        return this.RequestFrom("skin", "GetSkinMaterialSet", ...args);
    }

    GetSkinMaterialTypeIDs(...args)
    {
        return this.RequestFrom("skin", "GetSkinMaterialTypeIDs", ...args);
    }

    GetTypeIDSkinIDs(...args)
    {
        return this.RequestFrom("skin", "GetTypeIDSkinIDs", ...args);
    }

    GetSkinr(...args)
    {
        return this.RequestFrom("skin", "GetSkinr", ...args);
    }

    GetSkinrPattern(...args)
    {
        return this.RequestFrom("skinr", "GetSkinrPattern", ...args);
    }

    /**
     * @param {Object} skin - a SKINR skin payload
     * @returns {Promise<TnySkinrDesign>}
     */
    GenerateSkinrDna(...args)
    {
        return this.RequestFrom("skinr", "GenerateDna", ...args);
    }

    /**
     * The method `TnySpaceObject.resolve` calls for a SKINR uuid.
     * @param {String} skinrID - a SKINR design uuid
     * @returns {Promise<TnySkinrDesign>}
     */
    GenerateSkinrDnaFromId(...args)
    {
        return this.RequestFrom("skinr", "GenerateDnaFromId", ...args);
    }

    LookupName(...args)
    {
        return this.RequestFrom("skin", "LookupName", ...args);
    }

    SearchName(...args)
    {
        return this.RequestFrom("skin", "SearchName", ...args);
    }

    ResolveTypeDna(...args)
    {
        return this.RequestFrom("skin", "ResolveTypeDna", ...args);
    }

    ResolveSkinDna(...args)
    {
        return this.RequestFrom("skin", "ResolveSkinDna", ...args);
    }

    /**
     * @param {Object} options
     * @param {Number} options.typeID
     * @param {Number} [options.skinID]
     * @returns {Promise<TnyDnaResolution>}
     */
    ResolveDna(...args)
    {
        return this.RequestFrom("skin", "ResolveDna", ...args);
    }

    /**
     * @param {Number} moonID
     * @param {Object} [params]
     * @returns {Promise<TnyCelestial>}
     */
    async GetMoon(moonID, params)
    {
        const esi = await this.RequestFrom("esi", "GetMoon", moonID, params);
        if (this.sde && this.sde.GetMoon)
        {
            return Object.assign({}, esi, await this.sde.GetMoon(moonID));
        }
        return esi;
    }

    /**
     * @param {Number} planetID
     * @param {Object} [params]
     * @returns {Promise<TnyCelestial>}
     */
    async GetPlanet(planetID, params)
    {
        const esi = await this.RequestFrom("esi", "GetPlanet", planetID, params);
        if (this.sde && this.sde.GetPlanet)
        {
            return Object.assign({}, esi, await this.sde.GetPlanet(planetID));
        }
        return esi;
    }

    GetSystem(...args)
    {
        return this.RequestFrom("esi", "GetSystem", ...args);
    }

    GetBillboards(...args)
    {
        return this.RequestFrom("tools", "GetBillboards", ...args);
    }

    GetResource(...args)
    {
        return this.RequestFrom("tools", "GetResource", ...args);
    }

    GetNebulas(...args)
    {
        return this.RequestFrom("tools", "GetNebulas", ...args);
    }

    GetCubes(...args)
    {
        return this.RequestFrom("tools", "GetCubes", ...args);
    }

    GetHullResPathInserts(...args)
    {
        return this.RequestFrom("tools", "GetHullResPathInserts", ...args);
    }

    ResolveHullResPathInserts(...args)
    {
        return this.RequestFrom("tools", "ResolveHullResPathInserts", ...args);
    }

    GetWeaponLibrary(...args)
    {
        return this.RequestFrom("tools", "GetWeaponLibrary", ...args);
    }

    LookupWeaponName(...args)
    {
        return this.RequestFrom("tools", "LookupWeaponName", ...args);
    }

    SearchWeaponName(...args)
    {
        return this.RequestFrom("tools", "SearchWeaponName", ...args);
    }

    GetWeaponTypes(...args)
    {
        return this.RequestFrom("tools", "GetWeaponTypes", ...args);
    }

    GetWeaponType(...args)
    {
        return this.RequestFrom("tools", "GetWeaponType", ...args);
    }

    GetWeaponAmmunition(...args)
    {
        return this.RequestFrom("tools", "GetWeaponAmmunition", ...args);
    }

    GetWeaponProjectiles(...args)
    {
        return this.RequestFrom("tools", "GetWeaponProjectiles", ...args);
    }

}
