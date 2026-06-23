import { getCache } from "./cache";
import { getURL as getESIUrl } from "./esi";
import { tw2 } from "global";
import { objectSnakeToCamel } from "./transforms";
import { isNumber } from "utils";


/**
 * Simple remote JSON file getter
 * @param {String} url
 * @param {Object} [options={}]
 * @param {Number} [options.cacheTimer]
 * @param {Function} [options.transform]
 * @param {Function} [options.validate]
 * @returns {Promise<Object|Array>}
 */
const getJSONSimple = async (url, options = {}) =>
{
    const { cacheTimer, transform, validate } = options;

    //console.log({ url, options });

    const localCache = getCache();
    if (!localCache.has(url))
    {
        const promise = tw2.resMan.Fetch(url, "json")
            .then(json =>
            {
                if (transform) json = transform(json);
                if (!json) throw new ReferenceError(`${url}: resulting data is empty`);
                if (validate) validate(json);
                return json;
            });

        localCache.set(url, promise, cacheTimer);
    }

    return localCache.get(url);
};


export class NotFoundError extends Error
{
    constructor(idProperty, id)
    {
        super();
        this.message = `${idProperty}${id && typeof id === "string" && id.includes(",") ? "s" : ""} not found: ${id}`;
    }
}

/**
 * Creates 'api like' get handlers for a static JSON file
 * @param {Object} options
 * @param {String} options.href
 * @param {Function} [options.get]
 * @param {Function} [options.getOne]
 * @param {Function} [options.getIDs]
 * @param {String} [options.idProperty]
 * @param {Function} [options.type]
 * @param {Function} [options.transform]
 * @param {Boolean|Number} [options.cache=true]
 * @returns {{get: !Function, getMany: !Function, getOne: !Function, getIDs: !Function}}
 * @throws If options.href is not provided
 * @throws If idProperty is not provided when it is required
 * @throws If idProperty key is not found in an object
 * @throws If the returned json isn't an array or isn't transformed into an array
 */
export function createGetHandlersForRemoteJSON(options)
{
    if (!options.href) throw new Error("Href must be provided");

    const {
        href,
        get,
        getOne,
        getIDs,
        idProperty,
        idType = Number,
        transformAll,
        cacheTimer
    } = options;

    const out = {
        getOne: undefined,
        getMany: undefined,
        getIDs: undefined,
        get: undefined
    };

    /**
     * An internal handler for retrieving the json data
     * @returns {Promise<*>}
     */
    const getJSONInternal = async () =>
    {
        return getJSONSimple(href, {
            cacheTimer,
            transform: transformAll,
            validate: data =>
            {
                if (!Array.isArray(data))
                {
                    console.dir(data);
                    throw new Error("JSON Data must result in an array");
                }

                if (idProperty)
                {
                    for (let i = 0; i < data.length; i++)
                    {
                        // Check each entry has an id
                        if (data[i][idProperty] === undefined)
                        {
                            console.debug(data);
                            throw new ReferenceError("Property ID value missing on item");
                        }

                        // Check the property's type
                        if (idType && data[i][idProperty].constructor !== idType)
                        {
                            console.debug(data);
                            throw new TypeError("Property ID value type is invalid");
                        }
                    }
                }
            }
        });
    };

    if (get)
    {
        out.get = getJSONInternal;
    }

    if (getIDs || getOne)
    {
        if (!idProperty) throw new Error("ID property must be defined");

        if (getIDs)
        {
            out.getIDs = async function ()
            {
                const results = await getJSONInternal();
                return results.map(x => x[idProperty]);
            };
        }

        if (getOne)
        {
            out.getOne = async id =>
            {
                const results = await getJSONInternal();
                const found = results.find(x => x[idProperty] === id);
                if (!found)
                {
                    console.dir({ idProperty, id, results });
                    throw new NotFoundError(idProperty, id);
                }
                return found;
            };

            // TODO: Pass the values in the body and respect maximum calls/ pagination
            out.getMany = async values => Promise.all(tw2.util.toArray(values).map(x => out.getOne(x)));
        }
    }

    return out;
}


/**
 * Makes a simple get request to the ESI api
 * @param {Object} options
 * @param {String} options.endpoint             - the esi endpoint to call
 * @param {Number|Boolean} [options.cacheTimer] - the time to keep the data in the cache, falsy to keep forever
 * @param {Function} [options.transform]        - optional function to transform the resulting data before it is returned
 * @param {Function} [options.validate]         - optional function to validate the data before it is returned
 * @returns {Promise<*>}
 */
function getESISimple(options)
{
    return getJSONSimple(getESIUrl(options.endpoint), options);
}

/**
 * Creates methods for handling ESI endpoint calls
 * @param {Object} options
 * @param {String} options.endpoint
 * @param {!Boolean} [options.one=false]
 * @param {!Boolean} [options.ids=false]
 * @param {!Function} [options.idType]
 * @param {!Function} [options.transform]
 * @param {!Boolean|Number} [options.cache=true]
 * @returns {{getMany: !Function, getOne: !Function, getIDs: !Function}}
 */
export function createGetHandlersForESIEndpoint(options = {})
{
    if (!options.endpoint) throw new Error("Endpoint must be provided");

    const {
        endpoint,
        getOne = false,
        getIDs = false,
        get = false,
        idType = Number,
        idProperty,
        transformItem,
        cacheTimer,
        maxItems // Todo
    } = options;

    const out = {
        getOne: undefined,
        getMany: undefined,
        getIDs: undefined,
        get: undefined
    };

    if (get)
    {
        out.get = async () => getESISimple({ endpoint, cacheTimer });

        if (idProperty)
        {
            out.getIDs = async () => 
            {
                const raw = await out.get();
                return raw.map(x => x[idProperty]);
            };

            out.getOne = async(id) => 
            {
                const raw = await out.get();
                return raw.find(x => x[idProperty] === id);
            };
        }
    }
    else
    {
        if (getIDs)
        {
            out.getIDs = async () => getESISimple({ endpoint, cacheTimer });
        }

        if (getOne)
        {
            out.getOne = async value => getESISimple({
                endpoint: `${endpoint}/${value}`,
                cacheTimer,
                transform: async json =>
                {
                    json = objectSnakeToCamel(json);
                    if (transformItem) json = transformItem(json);
                    return json;
                }
            });

            // TODO: Pass the values in the body and respect maximum calls/ pagination
            out.getMany = async values => Promise.all(tw2.util.toArray(values).map(x => out.getOne(x)));
        }
    }
    return out;
}
