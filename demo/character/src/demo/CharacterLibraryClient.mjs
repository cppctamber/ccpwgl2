/** Fetches and installs one model-shaped schema-v7 or schema-v8 character library. */
export class CharacterLibraryClient
{
    #fetch;

    #LibraryManager;

    constructor({
        LibraryManager,
        fetch: fetchImplementation = globalThis.fetch?.bind(globalThis)
    } = {})
    {
        if (typeof LibraryManager !== "function")
        {
            throw new TypeError("CharacterLibraryClient requires a library manager constructor");
        }
        if (typeof fetchImplementation !== "function")
        {
            throw new TypeError("CharacterLibraryClient requires fetch");
        }

        this.#LibraryManager = LibraryManager;
        this.#fetch = fetchImplementation;
    }

    /** Loads JSON and lets runtime-character own validation and hydration. */
    async Load(url)
    {
        const response = await this.#fetch(String(url), {
            headers: { accept: "application/json" },
            cache: "no-store"
        });

        if (!response || response.ok !== true)
        {
            const status = response?.status ?? "unknown";
            throw new Error(`Character library request failed with HTTP ${status}`);
        }

        const values = await response.json();
        const manager = new this.#LibraryManager();
        manager.InstallLibrary(values);
        return manager;
    }
}

export default CharacterLibraryClient;
