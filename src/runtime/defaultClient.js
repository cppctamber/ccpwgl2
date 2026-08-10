/**
 * The client debug helpers fall back to when they are handed nothing.
 *
 * This exists so nothing has to reach through `window`. It is deliberately a
 * leaf module: `tny.js` imports `register.js`, which imports the debug
 * constructors, so a debug helper importing `tny` directly would close an
 * import cycle and evaluate `tny.js` before its constructors exist.
 *
 * Production code should pass its client explicitly; this is the convenience
 * for consoles and debug overlays, and it holds whatever tny.js installed.
 */

let defaultClient = null;

/**
 * Installs the client debug helpers default to.
 * @param {*} client
 * @returns {*} the installed client
 */
export function SetDefaultClient(client)
{
    defaultClient = client || null;
    return defaultClient;
}

/**
 * @returns {*} the default client, or null when none has been installed
 */
export function GetDefaultClient()
{
    return defaultClient;
}
