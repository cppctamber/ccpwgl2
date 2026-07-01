import { meta } from "utils";


@meta.tny.type("TnyApiService")
@meta.tny.define("TnyApiService")
export class TnyApiService extends meta.Model
{

    esi = null;
    sde = null;
    providers = [];

    constructor(options = {})
    {
        super();

        const esi = options.esi || options.esiProvider,
            sde = options.sde || options.sdeProvider;

        if (esi)
        {
            this.SetESIProvider(esi);
        }

        if (sde)
        {
            this.SetSDEProvider(sde);
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

        if (name === "esi" || name === "sde")
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

    LinkProviders()
    {
        if (this.sde && this.esi && this.sde.SetTypeProvider && !this.sde.typeProvider)
        {
            this.sde.SetTypeProvider(this.esi);
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

    GetResPathFromTypeIDAndSkinMaterialID(...args)
    {
        return this.RequestFrom("sde", "GetResPathFromTypeIDAndSkinMaterialID", ...args);
    }

    GetResPathFromTypeIDAndSkinID(...args)
    {
        return this.RequestFrom("sde", "GetResPathFromTypeIDAndSkinID", ...args);
    }

    GetSkin(...args)
    {
        return this.RequestFrom("sde", "GetSkin", ...args);
    }

    GetSkinMaterial(...args)
    {
        return this.RequestFrom("sde", "GetSkinMaterial", ...args);
    }

    GetSkinMaterialSet(...args)
    {
        return this.RequestFrom("sde", "GetSkinMaterialSet", ...args);
    }

    GetSkinMaterialTypeIDs(...args)
    {
        return this.RequestFrom("sde", "GetSkinMaterialTypeIDs", ...args);
    }

    GetTypeIDSkinIDs(...args)
    {
        return this.RequestFrom("sde", "GetTypeIDSkinIDs", ...args);
    }

    GetSkinMaterialSetFromSkinID(...args)
    {
        return this.RequestFrom("sde", "GetSkinMaterialSetFromSkinID", ...args);
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

}
