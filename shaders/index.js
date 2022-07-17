import { Tw2EffectRes } from "core";
import * as decals from "./decal";
import * as quad from "./quad";
import * as organic from "./organic";
import * as specialFX from "./specialFx";
import * as postProcess from "./postProcess";
import { tw2 } from "global";


/**
 * Raw json shaders
 * @type {Array<Object>}
 */
export const shaders = [];

/**
 * Normalizes shader code
 * @param {String} shaderCode
 * @returns {String}
 */
function normalizeShaderCode(shaderCode="")
{
    return shaderCode
        // Remove empty lines
        .replace(/^\s*$(?:\r\n?|\n)/gm, "")
        // remove all multi spaces
        .replace(/ +(?= )/g, "");
}

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
            let {
                name,
                replaces,
                description="",
                techniques={}
            } = obj[key];

            name = replaces ? replaces.toLowerCase() : name.toLowerCase();

            // Normalize techniques
            for (const key in techniques)
            {
                if (techniques.hasOwnProperty(key))
                {
                    const t = {
                        name: key,
                        passes: null
                    };

                    const cur = techniques[key];
                    if ("passes" in cur)
                    {
                        t.passes = cur.passes;
                    }
                    else
                    {
                        t.passes = Array.isArray(cur) ? cur : [ cur ];
                    }

                    for (let i = 0; i < t.passes.length; i++)
                    {
                        const
                            pass = t.passes[i],
                            vs = pass.vs || pass.vertex || null,
                            ps = pass.ps || pass.fragment || null;

                        if (vs && vs.shader) vs.shader = normalizeShaderCode(vs.shader);
                        if (ps && ps.shader) ps.shader = normalizeShaderCode(ps.shader);
                    }

                    techniques[key] = t;
                }
            }

            const normalized = { name, description, techniques };
            shaders.push(normalized);
        }
    }
}

addShaders(decals);
addShaders(quad);
addShaders(organic);
addShaders(specialFX);
addShaders(postProcess);


/**
 * Gets an overridden shader path
 * @param {String} shaderPath
 * @returns {String}
 */
export function getOverriddenShaderPath(shaderPath)
{
    if (!shaderPath) return "";

    const ext = shaderPath.substring(shaderPath.lastIndexOf("."));
    switch(ext)
    {
        case ".fx":
        case ".sm_hi":
        case ".sm_lo":

            const replaces = shaderPath
                .split(":/")[1]                                 // remove res
                .replace(ext, "")                               // remove extension
                .replace("/effect/", "/effect.gles2/")          // change the effect sub path to an absolute path
                .toLowerCase();

            const found = shaders.find(x => x.name === replaces);
            if (found)
            {
                const replacedWith = `manual:/${replaces}.sm_json`;

                tw2.Debug({
                    name: "Shader override",
                    message: `Replaced '${shaderPath}' with '${replacedWith}'`
                });

                if (!tw2.resMan.motherLode.Has(replacedWith))
                {
                    Tw2EffectRes.fromJSON(found);    // Load as a manual resource
                }

                return replacedWith;
            }
    }

    return shaderPath;
}

