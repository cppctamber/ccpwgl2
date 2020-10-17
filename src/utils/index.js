export * from "./arr";
export * from "./obj";
export * from "./type";
export * from "./uuid";
export * from "./url";
export * from "./reflect";

import * as meta from "./meta";

export { meta };

/**
 * Gets a path's extension
 * @param path
 * @returns {string|null}
 */
export function getPathExtension(path)
{
    const dot = path.lastIndexOf(".");
    if (dot === -1) return null;
    return path.substr(dot + 1);
}
