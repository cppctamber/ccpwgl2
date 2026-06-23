import { toArray } from "utils";
import { STORE, Tw2GenericStore } from "./Tw2GenericStore";


/**
 * JSON shader definition store
 */
export class Tw2ShaderStore extends Tw2GenericStore
{

    /**
     * Constructor
     */
    constructor()
    {
        super();
        STORE.get(this).overrides = new Map();
        this.list = [];
    }

    /**
     * Sets a shader definition
     * @param {String} key
     * @param {Object} shader
     * @returns {Object}
     */
    Set(key, shader)
    {
        const
            registered = this.constructor.onBefore(shader, key, this),
            { map, overrides } = STORE.get(this),
            existing = map.get(registered.name);

        if (existing)
        {
            const index = this.list.indexOf(existing);
            if (index !== -1) this.list[index] = registered;
            if (existing.replaces) overrides.delete(existing.replaces);
        }
        else
        {
            this.list.push(registered);
        }

        map.set(registered.name, registered);
        if (registered.replaces) overrides.set(registered.replaces, registered);
        this.EmitEvent("stored", { key: registered.name, value: registered });
        return registered;
    }

    /**
     * Registers shader definitions from an object or array
     * @param {Object|Array<Object>} opt
     */
    Register(opt)
    {
        opt = toArray(opt);
        for (let i = 0; i < opt.length; i++)
        {
            this._RegisterItem(opt[i]);
        }
    }

    /**
     * Registers a shader definition, array, or key:shader map
     * @param {*} item
     * @private
     */
    _RegisterItem(item)
    {
        if (Array.isArray(item))
        {
            for (let i = 0; i < item.length; i++)
            {
                this._RegisterItem(item[i]);
            }
            return;
        }

        if (this.constructor.isValue(item))
        {
            this.RegisterShader(item);
            return;
        }

        for (const key in item)
        {
            if (item.hasOwnProperty(key))
            {
                this.RegisterShader(item[key], key);
            }
        }
    }

    /**
     * Registers a shader definition
     * @param {Object} shader
     * @param {String} [key]
     * @returns {Object}
     */
    RegisterShader(shader, key)
    {
        return this.Set(key || shader.name || shader.replaces, shader);
    }

    /**
     * Registers shader definitions
     * @param {Object|Array<Object>} shaders
     */
    RegisterShaders(shaders)
    {
        return this.Register(shaders);
    }

    /**
     * Gets a shader by name
     * @param {String} name
     * @returns {Object}
     */
    GetShaderByName(name)
    {
        return this.Get(this.constructor.NormalizeShaderName(name));
    }

    /**
     * Gets a registered shader override for a resource path
     * @param {String} shaderPath
     * @returns {{path: String, shader: Object}|null}
     */
    GetShaderOverride(shaderPath)
    {
        if (!shaderPath) return null;

        const ext = shaderPath.substring(shaderPath.lastIndexOf(".")).toLowerCase();
        switch(ext)
        {
            case ".sm_json":
                if (shaderPath.indexOf("manual:/") === 0)
                {
                    const name = this.constructor.NormalizeShaderName(shaderPath);
                    if (this.Has(name))
                    {
                        return { path: shaderPath, shader: this.Get(name) };
                    }
                }
                break;

            case ".fx":
            case ".sm_hi":
            case ".sm_lo":
            case ".sm_depth":
            {
                const
                    name = this.constructor.NormalizeShaderName(shaderPath),
                    shader = STORE.get(this).overrides.get(name);

                if (shader)
                {
                    return {
                        path: `manual:/${name}.sm_json`,
                        shader
                    };
                }
                break;
            }
        }

        return null;
    }

    /**
     * Checks if a shader definition is valid
     * @param {Object} shader
     * @returns {Boolean}
     */
    static isValue(shader)
    {
        return !!(shader && (shader.name || shader.replaces));
    }

    /**
     * Normalizes a shader definition before it is stored
     * @param {Object} shader
     * @returns {Object}
     */
    static onBefore(shader)
    {
        if (!this.isValue(shader))
        {
            throw new ReferenceError("Invalid shader definition");
        }

        const
            shaderName = this.NormalizeShaderName(shader.name || shader.replaces),
            replaces = shader.replaces ? this.NormalizeShaderName(shader.replaces) : null,
            name = replaces || shaderName,
            techniques = shader.techniques || {};

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

                    if (vs && vs.shader) vs.shader = this.NormalizeShaderCode(vs.shader);
                    if (ps && ps.shader) ps.shader = this.NormalizeShaderCode(ps.shader);
                }

                techniques[key] = t;
            }
        }

        return { name, replaces, description: shader.description || "", techniques };
    }

    /**
     * Normalizes shader code
     * @param {String} shaderCode
     * @returns {String}
     */
    static NormalizeShaderCode(shaderCode = "")
    {
        return shaderCode
            .replace(/^\s*$(?:\r\n?|\n)/gm, "")
            .replace(/ +(?= )/g, "");
    }

    /**
     * Normalizes a shader lookup key
     * @param {String} name
     * @returns {String}
     */
    static NormalizeShaderName(name)
    {
        return name
            .replace(/\\/g, "/")
            .replace(/^.*:\//, "")
            .replace(/\.(fx|sm_hi|sm_lo|sm_depth|sm_json)$/i, "")
            .replace("/effect/", "/effect.gles2/")
            .toLowerCase();
    }

    /**
     * The store's name
     * @type {String}
     */
    static storeName = "Shader";

}
