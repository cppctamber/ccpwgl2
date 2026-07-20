import { resMan } from "global";


/** Fetches and memoizes complete generated JSON library assets. */
export class TnyGeneratedLibraryProvider
{

    fetcher = null;
    cache = new Map();

    constructor(options = {})
    {
        if (options.fetcher) this.fetcher = options.fetcher;
        if (options.cache) this.cache = options.cache;
    }

    ClearCache()
    {
        this.cache.clear();
        return this;
    }

    GetLibrary(url)
    {
        const key = String(url || "");

        if (!key)
        {
            throw new TypeError("Generated library URL is required");
        }

        if (!this.cache.has(key))
        {
            this.cache.set(key, this.FetchLibrary(key).catch(error =>
            {
                this.cache.delete(key);
                throw error;
            }));
        }

        return this.cache.get(key);
    }

    async FetchLibrary(url)
    {
        const fetcher = this.fetcher || resMan.FetchRaw.bind(resMan);
        let value = await fetcher(url, "arraybuffer");

        if (typeof Response !== "undefined" && value instanceof Response)
        {
            value = await value.arrayBuffer();
        }

        if (typeof value === "string")
        {
            return JSON.parse(value);
        }

        const isBlob = typeof Blob !== "undefined" && value instanceof Blob;

        if (value && typeof value === "object" && !(value instanceof ArrayBuffer)
            && !ArrayBuffer.isView(value) && !isBlob)
        {
            return value;
        }

        if (!value)
        {
            throw new TypeError(`Generated library ${url} returned no data`);
        }

        const bytes = isBlob
            ? new Uint8Array(await value.arrayBuffer())
            : value instanceof ArrayBuffer
                ? new Uint8Array(value)
                : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        let stream = new Blob([ bytes ]).stream();

        if (bytes[0] === 0x1f && bytes[1] === 0x8b)
        {
            if (typeof window.DecompressionStream !== "function")
            {
                throw new Error("This browser cannot decode generated gzip library assets");
            }

            stream = stream.pipeThrough(new window.DecompressionStream("gzip"));
        }

        return new Response(stream).json();
    }

    FetchJSON(url, fetcher = this.fetcher)
    {
        fetcher = fetcher || resMan.FetchRaw.bind(resMan);
        return fetcher(url, "json");
    }

}
