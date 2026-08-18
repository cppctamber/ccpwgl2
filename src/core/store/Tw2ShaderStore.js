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
     * Empties the store: registered shader definitions and the `replaces`
     * overrides that swap a resolved effect path for a hand-written
     * `manual:/...sm_json` shader.
     *
     * The overrides are keyed on `graphics/effect.gles2/...` and are consulted
     * before the effect profile is, so while they are registered a hull always
     * loads its JSON shader and never reaches a Carbon container - whatever
     * `effectProfile` says. Clearing them is how the Carbon path gets exercised
     * on a hull; `Tw2Effect.UNPACKED_TEXTURES` must stay true, since it decides
     * textures rather than shaders.
     *
     * @returns {Number} Number of overrides removed.
     */
    Clear()
    {
        const store = STORE.get(this);
        const removed = store.overrides.size;

        store.overrides.clear();
        store.map.clear();
        this.list.splice(0);
        return removed;
    }

    /**
     * Removes only the `replaces` overrides, leaving registered shader
     * definitions in place.
     *
     * Distinguishing the two matters when diagnosing: `Clear` also drops the
     * definition map, so anything still looking a shader up by name loses it,
     * and a blank frame afterwards could be either cause.
     *
     * @returns {Number} Number of overrides removed.
     */
    ClearOverrides()
    {
        const store = STORE.get(this);
        const removed = store.overrides.size;

        store.overrides.clear();
        return removed;
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

        // These overrides are hand-written GLES2 shaders. They stand in for
        // one compiled profile and must never reach another: a gles2 body
        // carries none of the conventions a translated dx11 body relies on -
        // no emitter depth-range fixup, Carbon's b1-b4 register layouts, or
        // the Carbon binder's uploads - so substituting one into a
        // dx11/webgl2 scene produces a shader that links and draws wrongly
        // rather than one that fails.
        //
        // Gated BEFORE normalization, deliberately. NormalizeShaderName
        // rewrites an unresolved `/effect/` path to `/effect.gles2/` so a
        // definition can declare `replaces` either way, and gating after it
        // would let an unqualified path acquire gles2 and match. Tw2Effect
        // already resolves the profile before calling here; this makes the
        // store independent of that rather than reliant on it.
        //
        // Lower-cased because running before NormalizeShaderName means running
        // before its `toLowerCase`. Resource paths are lower case by
        // convention, so a mixed-case one would pass every other check and
        // fail only here - and it would fail OPEN, silently declining an
        // override that should have applied.
        if (!shaderPath.toLowerCase().includes(this.constructor.OVERRIDE_EFFECT_DIR)) return null;

        // `.sm_json` is not handled: a manual path is one an override already
        // produced, so re-entering would resolve an override against itself.
        const ext = shaderPath.substring(shaderPath.lastIndexOf(".")).toLowerCase();
        switch(ext)
        {
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
     * The only compiled-effect profile directory these overrides may replace.
     * Matches Tw2Device.EffectProfiles["effect.gles2"].
     * @type {String}
     */
    static OVERRIDE_EFFECT_DIR = "/effect.gles2/";

    /**
     * The store's name
     * @type {String}
     */
    static storeName = "Shader";

}
