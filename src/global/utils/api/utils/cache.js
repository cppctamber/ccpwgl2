function Cache()
{

    const cache = new Map();

    /**
     * Adds a unique item to the cache
     * @param {String} unique    - a unique identifier
     * @param {*} item           - the item to store
     * @param {Number} [timeout] - Optional time out
     */
    this.set = function(unique, item, timeout)
    {
        cache.set(unique, item);
        if (timeout && typeof timeout == "number")
        {
            setTimeout(() =>
            {
                if (cache.get(unique) === item) cache.delete(unique);
            });
        }
    };

    /**
     * Removes a unique item from the cache
     * @param {String} unique
     */
    this.remove = function(unique)
    {
        cache.delete(unique);
    };

    /**
     * Checks if a unique item exists in the cache
     * @param {String} unique
     * @returns {boolean}
     */
    this.has = function(unique)
    {
        return cache.has(unique);
    };

    /**
     * Gets a unique item from the cache
     * @param {String} unique
     * @returns {*}
     */
    this.get = function(unique)
    {
        return cache.get(unique);
    };

}

let cache = null;

export function getCache()
{
    if (!cache) cache = new Cache();
    return cache;
}