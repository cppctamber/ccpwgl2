import { TnyApiService } from "./TnyApiService";
import { TnyCharacterApiProvider } from "./providers/TnyCharacterApiProvider";
import { TnyESIApiProvider } from "./providers/TnyESIApiProvider";
import { TnySDEApiProvider } from "./providers/TnySDEApiProvider";
import { TnySkinApiProvider } from "./providers/TnySkinApiProvider";


export function createApiService(options = {})
{
    const
        esi = options.esi || options.esiProvider || new TnyESIApiProvider(options.esiOptions || {}),
        sde = options.sde || options.sdeProvider || new TnySDEApiProvider(Object.assign({
            typeProvider: esi
        }, options.sdeOptions)),
        skin = options.skin || options.skinProvider || new TnySkinApiProvider(Object.assign({
            toolsService: options.toolsService,
            typeProvider: esi
        }, options.skinOptions)),
        characterLibrary = options.characterLibrary || options.characterProvider
            || new TnyCharacterApiProvider(Object.assign({
                toolsService: options.toolsService
            }, options.characterOptions));

    return new TnyApiService(Object.assign({}, options, { esi, sde, skin, characterLibrary }));
}

export function createToolsServiceConfig(bootstrap, options = {})
{
    const apiRoot = TnyCharacterApiProvider.BuildToolsServiceRoot(bootstrap, options);

    return {
        apiOptions: {
            toolsService: bootstrap,
            skinOptions: {
                target: options.target || "eve",
                build: options.build || "latest",
                scheme: options.scheme || "http"
            },
            characterOptions: {
                target: options.target || "eve",
                build: options.build || "latest",
                scheme: options.scheme || "http"
            }
        },
        paths: {
            res: `${apiRoot}/res/`
        }
    };
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
