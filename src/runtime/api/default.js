import { TnyApiService } from "./TnyApiService";
import { TnyCharacterApiProvider } from "./providers/TnyCharacterApiProvider";
import { TnyESIApiProvider } from "./providers/TnyESIApiProvider";
import { TnySDEApiProvider } from "./providers/TnySDEApiProvider";
import { TnySkinApiProvider } from "./providers/TnySkinApiProvider";
import { TnyToolsApiProvider } from "./providers/TnyToolsApiProvider";


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
            }, options.characterOptions)),
        tools = options.tools || options.toolsProvider
            || new TnyToolsApiProvider(options.toolsOptions || {});

    return new TnyApiService(Object.assign({}, options, { esi, sde, skin, characterLibrary, tools }));
}

export function createToolsServiceConfig(bootstrap, options = {})
{
    const
        target = options.target || "ccp",
        apiRoot = TnyCharacterApiProvider.BuildToolsServiceRoot(
            bootstrap,
            Object.assign({}, options, { target })
        ),
        resourceRoot = `${apiRoot}/resources`;

    return {
        apiOptions: {
            toolsService: bootstrap,
            skinOptions: {
                target,
                build: options.build || "latest",
                scheme: options.scheme || "http"
            },
            characterOptions: {
                target,
                build: options.build || "latest",
                scheme: options.scheme || "http"
            },
            toolsOptions: {
                apiRoot,
                resourceRoot
            }
        },
        paths: {
            api: `${apiRoot}/`,
            res: `${resourceRoot}/`
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
