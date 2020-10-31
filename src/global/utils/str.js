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
