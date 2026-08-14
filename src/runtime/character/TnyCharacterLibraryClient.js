import { tw2 } from "global";


/** Fetches and installs one compatible model-shaped character library. */
export class TnyCharacterLibraryClient
{
    _LibraryManager;

    constructor({
        LibraryManager
    } = {})
    {
        if (typeof LibraryManager !== "function")
        {
            throw new TypeError("TnyCharacterLibraryClient requires a library manager constructor");
        }
        if (!tw2?.resMan || typeof tw2.resMan.FetchRaw !== "function")
        {
            throw new TypeError("TnyCharacterLibraryClient requires tw2.resMan.FetchRaw");
        }

        this._LibraryManager = LibraryManager;
    }

    /** Loads JSON and lets runtime-character own validation and hydration. */
    async Load(url)
    {
        const values = await tw2.resMan.FetchRaw(String(url), "json");
        const manager = new this._LibraryManager();
        manager.InstallLibrary(values);
        return manager;
    }
}
