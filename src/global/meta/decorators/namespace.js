/**
 * Meta namespace helpers
 */

/**
 * Creates a strict namespace wrapper for decorators
 * @param {Object} decorators
 * @param {String} namespace
 * @param {Object} options
 * @param {String} [options.version]
 * @returns {Object}
 */
export function createMetaNamespace(decorators, namespace, { version } = {})
{
    const namespaceDecorators = Object.create(null);

    Object.defineProperty(namespaceDecorators, "_version", {
        value: version || "0",
        enumerable: false,
        writable: false,
    });

    for (const key in decorators)
    {
        if (key === "_version") continue;
        Object.defineProperty(namespaceDecorators, key, {
            value: decorators[key],
            enumerable: true,
            writable: false,
            configurable: false
        });
    }

    namespaceDecorators.__namespace = namespace;

    return Object.freeze(namespaceDecorators);
}
