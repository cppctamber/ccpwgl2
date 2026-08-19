import { Buffer } from "node:buffer";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 8083;
const MODULE_CONTENT_TYPE = "text/javascript; charset=utf-8";

/** Creates the isolated character demo server without rebuilding ccpwgl. */
export function createCharacterDemoServer(options = {})
{
    const currentDirectory = dirname(fileURLToPath(import.meta.url));
    const repositoryRoot = options.repositoryRoot
        ? resolve(options.repositoryRoot)
        : resolve(currentDirectory, "../..");
    const carbonengineRoot = resolve(
        options.carbonengineRoot ?? repositoryRoot,
        options.carbonengineRoot ? "." : "../carbonenginejs-org"
    );
    const characterRoot = resolve(repositoryRoot, "demo/character");
    const runtimeCharacterRoot = resolve(carbonengineRoot, "runtime-character/npm/dist");
    const runtimeUtilsRoot = resolve(carbonengineRoot, "runtime-utils/src");
    const libraryPath = options.libraryPath ? resolve(options.libraryPath) : null;
    const toolsServiceConfig = NormalizeToolsServiceConfig(options.toolsServiceConfig);
    const exactRoutes = new Map([
        [ "/demo/character/", resolve(characterRoot, "index.html") ],
        [ "/demo/character/index.html", resolve(characterRoot, "index.html") ],
        [ "/demo/character/stylesheet.css", resolve(characterRoot, "stylesheet.css") ],
        [ "/dist/ccpwgl2_int.js", resolve(repositoryRoot, "dist/ccpwgl2_int.js") ]
    ]);

    if (libraryPath)
    {
        exactRoutes.set("/local/character-library.json", libraryPath);
    }

    const moduleRoutes = [
        {
            prefix: "/src/runtime/character/",
            root: resolve(repositoryRoot, "src/runtime/character"),
            extensions: new Set([ ".js" ])
        },
        {
            prefix: "/demo/character/src/",
            root: resolve(characterRoot, "src"),
            extensions: new Set([ ".mjs" ])
        },
        {
            prefix: "/vendor/runtime-character/",
            root: runtimeCharacterRoot,
            extensions: new Set([ ".js" ])
        },
        {
            prefix: "/vendor/runtime-utils/",
            root: runtimeUtilsRoot,
            extensions: new Set([ ".js" ])
        }
    ];

    return createServer(async (request, response) =>
    {
        try
        {
            if (request.method !== "GET" && request.method !== "HEAD")
            {
                SendText(response, 405, "Method not allowed", request.method);
                return;
            }

            const url = new URL(request.url ?? "/", `http://${HOST}`);

            if (url.pathname === "/local/tools-service.json")
            {
                if (!toolsServiceConfig)
                {
                    SendText(response, 404, "Tools service not configured", request.method);
                    return;
                }
                SendJson(response, 200, toolsServiceConfig, request.method);
                return;
            }

            if (url.pathname === "/" || url.pathname === "/demo/character")
            {
                response.writeHead(302, { location: "/demo/character/" });
                response.end();
                return;
            }

            let filePath = exactRoutes.get(url.pathname) ?? null;

            if (!filePath)
            {
                for (const route of moduleRoutes)
                {
                    if (!url.pathname.startsWith(route.prefix)) continue;
                    filePath = ResolveModulePath(route, url.pathname);
                    break;
                }
            }

            if (!filePath)
            {
                SendText(response, 404, "Not found", request.method);
                return;
            }

            await SendFile(response, filePath, request.method);
        }
        catch (error)
        {
            const statusCode = error?.code === "ENOENT" ? 404 : 500;
            SendText(response, statusCode, statusCode === 404 ? "Not found" : "Server error", request.method);
        }
    });
}

function ResolveModulePath(route, pathname)
{
    let decoded;

    try
    {
        decoded = decodeURIComponent(pathname.slice(route.prefix.length));
    }
    catch
    {
        return null;
    }

    if (!decoded || decoded.includes("\0") || decoded.split(/[\\/]/u).includes(".."))
    {
        return null;
    }

    const filePath = resolve(route.root, decoded);
    const remainder = relative(route.root, filePath);

    if (!remainder || remainder.startsWith(`..${sep}`) || remainder === ".." || isAbsolute(remainder))
    {
        return null;
    }
    if (!route.extensions.has(extname(filePath).toLowerCase()))
    {
        return null;
    }

    return filePath;
}

async function SendFile(response, filePath, method)
{
    const info = await stat(filePath);

    if (!info.isFile())
    {
        SendText(response, 404, "Not found", method);
        return;
    }

    response.writeHead(200, {
        "cache-control": "no-store",
        "content-length": info.size,
        "content-type": GetContentType(filePath),
        "x-content-type-options": "nosniff"
    });

    if (method === "HEAD")
    {
        response.end();
        return;
    }

    createReadStream(filePath).pipe(response);
}

function SendText(response, statusCode, message, method)
{
    const body = `${message}\n`;
    response.writeHead(statusCode, {
        "cache-control": "no-store",
        "content-length": Buffer.byteLength(body),
        "content-type": "text/plain; charset=utf-8",
        "x-content-type-options": "nosniff"
    });
    response.end(method === "HEAD" ? undefined : body);
}

function SendJson(response, statusCode, value, method)
{
    const body = `${JSON.stringify(value)}\n`;
    response.writeHead(statusCode, {
        "cache-control": "no-store",
        "content-length": Buffer.byteLength(body),
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff"
    });
    response.end(method === "HEAD" ? undefined : body);
}

function NormalizeToolsServiceConfig(value)
{
    if (!value) return null;

    const source = typeof value === "string" ? JSON.parse(value) : value;
    const bootstrapValue = source.bootstrap ?? source;
    const bootstrap = typeof bootstrapValue === "string"
        ? JSON.parse(bootstrapValue)
        : bootstrapValue;
    const port = Number(bootstrap?.port);
    const target = String(source.target ?? "eve").trim();
    const build = String(source.build ?? "latest").trim();
    const scheme = String(source.scheme ?? "http").trim().toLowerCase();

    if (!bootstrap?.host || !Number.isSafeInteger(port) || port < 1 || port > 65535
        || !target || !build || ![ "http", "https" ].includes(scheme))
    {
        throw new TypeError("Invalid character tools service configuration");
    }

    return {
        bootstrap: { ...bootstrap, host: String(bootstrap.host), port },
        target,
        build,
        scheme
    };
}

function GetContentType(filePath)
{
    switch (extname(filePath).toLowerCase())
    {
        case ".css":
            return "text/css; charset=utf-8";
        case ".html":
            return "text/html; charset=utf-8";
        case ".json":
            return "application/json; charset=utf-8";
        case ".js":
        case ".mjs":
            return MODULE_CONTENT_TYPE;
        default:
            return "application/octet-stream";
    }
}

function ParseArguments(argv)
{
    const result = {
        port: DEFAULT_PORT,
        libraryPath: null,
        carbonengineRoot: null,
        toolsServiceConfig: process.env.CHARACTER_TOOLS_BOOTSTRAP
            ? {
                bootstrap: process.env.CHARACTER_TOOLS_BOOTSTRAP,
                target: process.env.CHARACTER_TOOLS_TARGET || "eve",
                build: process.env.CHARACTER_TOOLS_BUILD || "latest",
                scheme: process.env.CHARACTER_TOOLS_SCHEME || "http"
            }
            : null
    };

    for (let index = 0; index < argv.length; index++)
    {
        const argument = argv[index];

        if (argument === "--port")
        {
            result.port = Number(RequireArgument(argv, ++index, argument));
        }
        else if (argument === "--library")
        {
            result.libraryPath = RequireArgument(argv, ++index, argument);
        }
        else if (argument === "--carbonengine-root")
        {
            result.carbonengineRoot = RequireArgument(argv, ++index, argument);
        }
        else
        {
            throw new Error(`Unknown argument ${argument}`);
        }
    }

    if (!Number.isSafeInteger(result.port) || result.port < 0 || result.port > 65535)
    {
        throw new TypeError("Character demo port must be an integer from 0 through 65535");
    }

    return result;
}

function RequireArgument(argv, index, flag)
{
    const value = argv[index];

    if (!value || value.startsWith("--"))
    {
        throw new Error(`Missing value for ${flag}`);
    }

    return value;
}

const isMain = process.argv[1]
    && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();

if (isMain)
{
    const options = ParseArguments(process.argv.slice(2));
    const server = createCharacterDemoServer(options);

    server.listen(options.port, HOST, () =>
    {
        const address = server.address();
        console.log(`Character demo: http://${HOST}:${address.port}/demo/character/`);
        console.log(options.libraryPath
            ? "Character library: configured"
            : "Character library: not configured (pass --library <character-library.json>)");
    });
}
