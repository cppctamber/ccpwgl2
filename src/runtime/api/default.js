import { TnyApiService } from "./TnyApiService";
import { TnyESIApiProvider } from "./providers/TnyESIApiProvider";
import { TnySDEApiProvider } from "./providers/TnySDEApiProvider";


export function createApiService(options = {})
{
    const
        esi = options.esi || options.esiProvider || new TnyESIApiProvider(options.esiOptions || {}),
        sde = options.sde || options.sdeProvider || new TnySDEApiProvider(Object.assign({
            typeProvider: esi
        }, options.sdeOptions));

    return new TnyApiService(Object.assign({}, options, { esi, sde }));
}

let defaultApiService = createApiService();

export function setApiService(service)
{
    defaultApiService = service || createApiService();
    return defaultApiService;
}

export function getApiService()
{
    return defaultApiService;
}
