
const esi = {
    url: "https://esi.evetech.net",
    version: "latest",
    params: "datasource=tranquility"
};

/**
 * Sets the esi version to use
 * @param {String} version
 */
export function setVersion(version)
{
    esi.version = version;
}

/**
 * Gets the current esi version
 * @returns {string}
 */
export function getVersion()
{
    return esi.version;
}

/**
 * Sets ESI params from an object
 * @param {Object} options
 */
export function setESIParams(options)
{
    const result = Object.assign(getParams(), options);
    let str = "";
    for (const key in result)
    {
        if (result.hasOwnProperty(key))
        {
            str += `${key}=${result[key]}`.toLowerCase();
        }
    }
    esi.params = str;
}

/**
 * Gets ESI params as an object
 * @returns {{}}
 */
export function getParams()
{
    return esi.params.split("&").reduce((acc, curr) => 
    {
        const { key, value } = curr.split("=");
        acc[key] = value;
    }, {});
}

/**
 * Gets the ESI url for an endpoint
 * @param {String} endpoint
 * @returns {string}
 */
export function getURL(endpoint)
{
    return `${esi.url}/${esi.version}/${endpoint}${esi.params ? "?" + esi.params : ""}`;
}
