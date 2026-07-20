import { meta } from "utils";


@meta.tny.type("TnyApiService")
@meta.tny.define("TnyApiService")
export class TnyApiService extends meta.Model
{

    esi = null;
    sde = null;
    skin = null;
    characterLibrary = null;
    tools = null;
    providers = [];

    constructor(options = {})
    {
        super();

        const esi = options.esi || options.esiProvider,
            sde = options.sde || options.sdeProvider,
            skin = options.skin || options.skinProvider,
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

        if ([ "esi", "sde", "skin", "characterLibrary", "tools" ].includes(name))
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

    GetGraphic(...args)
    {
        return this.RequestFrom("esi", "GetGraphic", ...args);
    }

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

    ResolveDna(...args)
    {
        return this.RequestFrom("skin", "ResolveDna", ...args);
    }

    async GetMoon(moonID, params)
    {
        const esi = await this.RequestFrom("esi", "GetMoon", moonID, params);
        if (this.sde && this.sde.GetMoon)
        {
            return Object.assign({}, esi, await this.sde.GetMoon(moonID));
        }
        return esi;
    }

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
