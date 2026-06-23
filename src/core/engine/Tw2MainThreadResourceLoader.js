export class Tw2MainThreadResourceLoader
{
    /**
     * Constructor
     * @param {Tw2ResMan} resMan
     */
    constructor(resMan)
    {
        this.resMan = resMan;
    }

    /**
     * Fetches raw resource data
     * @param {String} url
     * @param {String|Function|null} responseType
     * @returns {Promise<*>}
     */
    Fetch(url, responseType)
    {
        return this.resMan.FetchRaw(url, responseType);
    }
}
