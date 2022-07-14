import * as decals from "./decal";
import * as others from "./other";
import * as quad from "./quad";
import { Tw2EffectRes } from "core";

export const shaders = {};

/**
 * Adds shaders from an object
 * @param {Object} obj
 */
function addShaders(obj)
{
    for (const key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            let name = obj[key].name;
            if (obj[key].path)
            {
                let path = obj[key].path;
                if (path.charAt(0) === "/") path = path.substring(1);
                if (path.charAt(path.length - 1) !== "/") path = path + "/";
                name = `${obj[key].path}${name}`;
            }
            name = name.toLowerCase();

            shaders[name] = {
                name,
                description: obj[key].description || "",
                techniques: obj[key].techniques
            };
        }
    }
}

addShaders(decals);
addShaders(others);
addShaders(quad);


let useOverrides = true;

/**
 * Toggles using overridden shader paths
 * @param {Boolean} bool
 */
export function useOverriddenShaderPaths(bool)
{
    useOverrides = !!bool;
}

/**
 * Gets an overridden shader path
 * @param {String} shaderPath
 * @returns {String}
 */
export function getOverriddenShaderPath(shaderPath)
{
    if (!shaderPath) return "";

    if (!useOverrides) return shaderPath;

    const ext = shaderPath.substring(shaderPath.lastIndexOf("."));
    switch(ext)
    {
        case ".fx":
        case ".sm_hi":
        case ".sm_lo":

            const replacement = shaderPath
                .split(":/")[1]                                 // remove res
                .replace(ext, "")                               // remove extension
                .replace("/effect/", "/effect.gles2/")          // change the effect sub path to an absolute path
                .toLowerCase();

            if (replacement in shaders)
            {
                console.warn(`Shader overridden: ${replacement}`);
                Tw2EffectRes.fromJSON(shaders[replacement]);    // Load as a manual resource
                return `manual:/${replacement}.sm_json`;
            }

            break;
    }

    return shaderPath;
}

