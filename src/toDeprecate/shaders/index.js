import * as decals from "./decal";
import * as quad from "./quad";
import * as other from "./other";
import * as postProcess from "./postProcess";


/**
 * Deprecated handcrafted shader definitions.
 * These are registered through Tw2ShaderLibrary and should be replaced by generated shader data.
 * @type {Array<Object>}
 */
export const shaders = [];


/**
 * Adds shader definitions from a module object
 * @param {Object} obj
 */
function addShaders(obj)
{
    for (const key in obj)
    {
        if (Object.prototype.hasOwnProperty.call(obj, key))
        {
            const shader = obj[key];
            if (shader && (shader.name || shader.replaces))
            {
                shaders.push(shader);
            }
        }
    }
}

addShaders(decals);
addShaders(quad);
addShaders(other);
addShaders(postProcess);
