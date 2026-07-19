import { meta, assignIfExists, getKeyFromValue, getPathExtension, isPlain, isString } from "utils";
import { device, tw2 } from "global";
import { Tw2TextureParameter } from "../parameter/Tw2TextureParameter";
import { Tw2Vector4Parameter } from "../parameter/Tw2Vector4Parameter";
import { fromList } from "core/reader/Tw2BlackPropertyReaders";
import { Tw2EffectRes, Tw2Resource } from "core/resource";
import { Tw2SamplerOverride } from "core/sampler";
import { CewgResourceBinder } from "core/cewg/CewgResourceBinder";


class TemporaryBinaryReader
{
    static blackStruct(r)
    {
        console.dir(r);
        throw new Error("Force fail");
    }
}

class Tw2ConstantParameter
{
    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     * @returns {Tw2Vector4Parameter}
     */
    static blackStruct(r)
    {
        const item = new Tw2Vector4Parameter();

        // Temporary
        Object.defineProperty(item, "isConstant", { value: true, writable: false });

        item.name = r.ReadStringU16();
        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");
        item.SetValue(r.ReadF32Array(4));
        return item;
    }

}


class Tw2EffectOption
{

    name = "";
    value = "";

    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     * @returns {Tw2EffectOption}
     */
    static blackStruct(r)
    {
        const item = new this();
        item.name = r.ReadStringU16();

        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");

        item.value = r.ReadStringU16();

        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");

        return item;
    }
}


@meta.type("Tw2Effect", "Tr2Effect")
@meta.define({
    wgl: "Tw2Effect",
    ccp: "Tr2Effect"
})
@meta.stage(1)
export class Tw2Effect extends meta.Model
{

    @meta.string
    name = "";

    @meta.path
    effectFilePath = "";

    /**
     * The effect's resource
     * @type {Tw2EffectRes}
     */
    @meta.struct("Tw2EffectRes")
    @meta.isPrivate
    effectRes = null;

    //@meta.plain
    parameters = {};

    //@meta.plain
    @meta.isPrivate
    techniques = {};

    @meta.notImplemented
    samplerOverrides = {};

    @meta.notImplemented
    options = {};

    @meta.struct("Tw2Shader")
    @meta.isPrivate
    shader = null;

    // ccpwgl

    @meta.boolean
    autoParameter = false;

    @meta.string
    defaultTechnique = "Main";

    @meta.boolean
    _isShadowEffect = false;

    _isAttached = false;
    _adapters = [];
    _effectResAdapters = [];
    _syncEffectResAdapters = true;

    /**
     * Identifies if the effect res has been manually attached
     * @return {boolean}
     */
    get isAttached()
    {
        return this._isAttached;
    }

    /**
     * Alias for effectRes
     * @return {Tw2EffectRes}
     */
    get res()
    {
        return this.effectRes;
    }

    /**
     * Adds an effect adapter.
     * @param {Object} adapter Adapter with optional lifecycle callbacks
     * @returns {Object} The adapter
     */
    AddAdapter(adapter)
    {
        if (!adapter)
        {
            throw new Error("Invalid effect adapter");
        }

        if (!this._adapters.includes(adapter))
        {
            this._adapters.push(adapter);
        }

        return adapter;
    }

    /**
     * Removes an effect adapter.
     * @param {Object} adapter Adapter to remove
     * @returns {boolean} True if removed
     */
    RemoveAdapter(adapter)
    {
        const index = this._adapters.indexOf(adapter);
        if (index === -1)
        {
            return false;
        }

        this._adapters.splice(index, 1);
        return true;
    }

    /**
     * Removes all effect adapters.
     * @returns {number} Number of removed adapters
     */
    ClearAdapters()
    {
        const count = this._adapters.length;
        this._adapters.splice(0);
        this._effectResAdapters.splice(0);
        this._syncEffectResAdapters = false;
        return count;
    }

    /**
     * Gets registered effect adapters.
     * @returns {Array<Object>} Adapters
     */
    GetAdapters()
    {
        return this._adapters.slice();
    }

    /**
     * Runs an adapter lifecycle hook.
     * @param {String} name Hook name
     * @param {Object} context Mutable draw context
     * @returns {Boolean} True if a hook ran
     * @private
     */
    _RunAdapterHook(name, context)
    {
        let ran = false;
        for (let i = 0; i < this._adapters.length; i++)
        {
            const fn = this._adapters[i]?.[name];
            if (fn)
            {
                fn.call(this._adapters[i], context);
                ran = true;
            }
        }
        return ran;
    }

    /**
     * Syncs adapters provided by the current effect resource.
     * @returns {Array<Object>} Active resource adapters
     * @private
     */
    _SyncEffectResAdapters()
    {
        for (let i = 0; i < this._effectResAdapters.length; i++)
        {
            this.RemoveAdapter(this._effectResAdapters[i]);
        }
        this._effectResAdapters.splice(0);

        if (!this._syncEffectResAdapters)
        {
            return this._effectResAdapters;
        }

        let adapters = [];
        if (this.effectRes?.GetEffectAdapters)
        {
            adapters = this.effectRes.GetEffectAdapters(this) || [];
        }
        if (!adapters.length && this.effectRes?.CreateEffectAdapters)
        {
            adapters = this.effectRes.CreateEffectAdapters(this) || [];
        }

        for (let i = 0; i < adapters.length; i++)
        {
            this._effectResAdapters.push(this.AddAdapter(adapters[i]));
        }

        return this._effectResAdapters;
    }

    /**
     * Initializes the Tw2Effect
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Sets the effect's file path
     * @param {String} effectFilePath
     * @param {Object} [opt]
     * @return {boolean}
     */
    SetValue(effectFilePath, opt)
    {
        this.effectFilePath = effectFilePath.toLowerCase();
        this.autoParameter = true;
        this.UpdateValues(opt);
    }


    /**
     * Gets the effect's file path
     * @return {string}
     */
    GetValue()
    {
        return this._isAttached ? null : this.effectFilePath;
    }

    /**
     * Checks if the effect has a technique
     * @param {String} name
     * @returns {boolean}
     */
    HasTechnique(name)
    {
        return this.IsGood() && name in this.techniques;
    }

    /**
     * Attaches an effect res
     * @param {Tw2EffectRes} res
     * @return {boolean}
     */
    AttachEffectRes(res)
    {
        return this._SetEffectRes(res, true);
    }

    /**
     * Sets an effect res
     * @param {Tw2EffectRes} res
     * @param {Boolean} [isAttached]
     * @return {boolean} True if updated
     * @private
     */
    _SetEffectRes(res, isAttached)
    {
        if (this.effectRes !== res)
        {
            this._RemoveEffectRes();
            this._isAttached = !!isAttached;
            this.effectRes = res;
            this._syncEffectResAdapters = true;
            // TODO: Need to delay one frame
            res.RegisterNotification(this);
            return true;
        }
        return false;
    }

    /**
     * Removes an effect res
     * @return {boolean} true if updated
     * @private
     */
    _RemoveEffectRes()
    {
        const res = this.effectRes;
        if (res)
        {
            for (let i = 0; i < this._effectResAdapters.length; i++)
            {
                this.RemoveAdapter(this._effectResAdapters[i]);
            }
            this._effectResAdapters.splice(0);
            this.effectRes = null;
            this.shader = null;
            this._isAttached = false;
            this.UnBindParameters();
            res.UnregisterNotification(this);
            this.EmitEvent(Tw2Resource.Event.RES_REMOVED, this, res);
            return true;
        }
        return false;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged(opt)
    {
        let res = null;

        if (this.isAttached)
        {
            res = this.effectRes;
        }
        else
        {
            this.effectFilePath = this.effectFilePath ? this.effectFilePath.toLowerCase() : "";
            if (this.effectFilePath)
            {
                // Auto shader replacement
                if (Tw2Effect.USE_SHADER_OVERRIDES && getPathExtension(this.effectFilePath) !== "sm_json")
                {
                    this.effectFilePath = Tw2Effect.getOverriddenShaderPath(this.effectFilePath);
                }
                // Auto fx quality
                if (getPathExtension(this.effectFilePath) === "fx") this.effectFilePath = device.ToEffectPath(this.effectFilePath);

                res = tw2.GetResource(this.effectFilePath);
            }
        }

        if (this._SetEffectRes(res))
        {
            this.BindParameters(opt);
        }
    }

    static USE_SHADER_OVERRIDES = true;

    /**
     * Temporary handler for unpacked textures
     * @param {String} path
     * @returns {String}
     */
    static getOverriddenShaderPath(path)
    {
        if (!this.UNPACKED_TEXTURES) return path;

        const override = tw2.shaders.GetShaderOverride(path);
        if (!override) return path;

        tw2.Debug({
            name: "Shader override",
            message: `Replaced '${path}' with '${override.path}'`
        });

        if (!tw2.resMan.motherLode.Has(override.path))
        {
            Tw2EffectRes.fromJSON(override.shader);
        }

        return override.path;
    }

    /**
     * Toggles using overridden effects
     * @param {Boolean} bool
     */
    static UNPACKED_TEXTURES = false;

    /**
     * Finds an effect parameter by it's name
     * @param {String} name
     * @returns {Tw2Parameter}
     */
    FindParameter(name)
    {
        return this.parameters[name] || null;
    }

    /**
     * Checks if the effect's resource is good
     * @returns {Boolean}
     */
    IsGood()
    {
        this.KeepAlive();
        return this.shader !== null;
    }

    /**
     * Keeps the effect and it's parameters alive
     */
    KeepAlive()
    {
        const res = this.GetResources();
        for (let i = 0; i < res.length; i++) res[i].KeepAlive();
    }

    /**
     * Gets effect resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effectRes && !out.includes(this.effectRes))
        {
            out.push(this.effectRes);
        }

        this.PerChild(x =>
        {
            if (x.struct.GetResources)
            {
                x.struct.GetResources(out);
            }
        });

        return out;
    }

    /**
     * Rebuilds Cached Data
     * @param {Tw2EffectRes} res
     */
    OnResPrepared(res)
    {
        // If it isn't the current res we don't care
        if (this.effectRes !== res)
        {
            return false;
        }

        this.effectRes = res;
        this.shader = null;

        // Populate `options` with every permutation dimension the shader
        // actually has, at its current value (anything the caller already
        // set wins over the effect file's defaults). This makes the full
        // option surface discoverable on the effect. Deliberately plain
        // values, no auto-rebuilding setters - change options, then call
        // Rebind().
        if (Array.isArray(res.permutations))
        {
            for (let i = 0; i < res.permutations.length; i++)
            {
                const permutation = res.permutations[i];
                if (permutation && permutation.name && !(permutation.name in this.options))
                {
                    this.options[permutation.name] = Tw2Effect.getPermutationDefaultOption(permutation);
                }
            }
        }

        try
        {
            this.shader = res.GetShader(this.options);
            this.BindParameters({ controller: res });
            this.EmitEvent(Tw2Resource.Event.RES_PREPARED, this, res);
            res.UnregisterNotification(this);
        }
        catch (err)
        {
            res.OnError(err);
        }

        return true;
    }

    /**
     * Fires on any uncaught resource events
     * @param {Tw2EffectRes} res
     * @param {Error} err
     */
    OnResEvent(res, err)
    {
        return Tw2Resource.parentOnResEvent(this, "effectRes", res, err);
    }

    /**
     * Sets a technique pass state override
     * @param {String} technique
     * @param {Number} pass
     * @param {Number} state
     * @param {Number|Boolean} value
     */
    SetTechniquePassStateOverride(technique, pass, state, value)
    {
        if (!this.techniques[technique]) this.techniques[technique] = [];
        if (!this.techniques[technique][pass]) this.techniques[technique][pass] = { state: [] };
        if (!this.techniques[technique][pass].state) this.techniques[technique][pass].state = [];

        const states = this.techniques[technique][pass].state;
        const s = states.find(x => x.state === state);
        if (!s)
        {
            states.push({ state, value });
        }
        else
        {
            s.value = value;
        }
    }

    /**
     * Gets a technique passes's state overrides
     * @param {String} technique
     * @param {Number} pass
     * @return {null|{ state: Number, value: Number|Boolean}}
     */
    GetTechniquePassStateOverrides(technique, pass)
    {
        if (technique in this.techniques && this.techniques[technique][pass] && this.techniques[technique][pass].state)
        {
            return this.techniques[technique][pass].state;
        }
        return null;
    }

    /**
     * Rebuilds the effect's shader from its current options and rebinds
     * parameters. Call after changing `options` - option values are
     * deliberately plain (no auto-rebuild setters), so the expected flow
     * is: mutate `effect.options`, then `effect.Rebind()`.
     * @param {Object} [opt]
     * @returns {Boolean} true if a shader was rebuilt
     */
    Rebind(opt)
    {
        const res = this.effectRes;

        // HasPrepared, not just IsGood: IsGood only means the raw bytes
        // loaded - parsing happens later in resMan's batched prepare
        // queue, and GetShader before then reads a null binary reader.
        // Callers hitting that window fall back to the normal flow:
        // OnResPrepared builds the shader from `options` when the
        // resource is actually ready.
        if (!res || !res.IsGood() || !res.HasPrepared()) return false;

        this.shader = res.GetShader(this.options);
        if (!this.shader) return false;

        this.BindParameters(opt);
        this.EmitEvent("rebuilt", this, opt);
        return true;
    }

    /**
     * Unbinds parameters
     * @param {Object} [opt]
     * @returns {Boolean}
     */
    UnBindParameters(opt)
    {
        for (let t in this.techniques)
        {
            if (this.techniques.hasOwnProperty(t))
            {
                let technique = this.techniques[t];
                for (let i = 0; i < technique.length; ++i)
                {
                    if (technique[i].stages)
                    {
                        for (let j = 0; j < technique[i].stages.length; ++j)
                        {
                            for (let k = 0; k < technique[i].stages[j].reroutedParameters.length; ++k)
                            {
                                technique[i].stages[j].reroutedParameters[k].Unbind();
                            }
                        }
                        technique[i].stages.splice(0);
                    }
                }
            }
        }

        // TODO: Replace this with a method it won't work if a parameter is
        // shared between effects and one doesn't use it

        for (const param in this.parameters)
        {
            if (this.parameters.hasOwnProperty(param))
            {
                this.parameters[param].usedByCurrentEffect = false;
                //this.parameters[param].usedByCurrentTechnique = false;
            }
        }

        for (const name in this.samplerOverrides)
        {
            if (this.samplerOverrides.hasOwnProperty(name) && this.samplerOverrides[name])
            {
                this.samplerOverrides[name].usedByCurrentEffect = false;
                //this.parameters[param].usedByCurrentTechnique = false;
            }
        }

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("unbound", this, opt);
        }

    }

    /**
     * Binds parameters
     * @param {Object} [opt]
     * @returns {Boolean}
     */
    BindParameters(opt)
    {

        if (!this.IsGood())
        {
            this.UnBindParameters();
            this.techniques = {};
            return false;
        }

        this.UnBindParameters({ skipEvents: true });

        // UnBindParameters only hollows out existing technique entries
        // (clears their stage arrays) - it doesn't remove technique keys
        // that don't exist on the new shader. Without this reset, a
        // technique name from a previously-bound shader (e.g. "Normal"
        // on a ship's original material) can survive an effectFilePath/
        // SetValue swap to a shader that doesn't have that technique at
        // all, stale but still passing ApplyPass's `technique in
        // this.techniques` guard, and crash reading
        // `this.shader.techniques[technique].passes[pass]` since the new
        // shader genuinely has no such entry.
        this.techniques = {};

        // Add object id for picking
        if (this.shader.HasConstant("objectId"))
        {
            if (!this.parameters.objectId)
            {
                this.parameters.objectId = new Tw2Vector4Parameter("objectId");
            }
            this.parameters.objectId.x = this._id;
        }

        let samplerOverrideNames = [];

        for (let techniqueName in this.shader.techniques)
        {
            if (this.shader.techniques.hasOwnProperty(techniqueName))
            {
                let technique = this.shader.techniques[techniqueName];
                let passes = [];

                for (let i = 0; i < technique.passes.length; ++i)
                {
                    const pass = { state: this.GetTechniquePassStateOverrides(techniqueName, i), stages: [] };

                    for (let j = 0; j < technique.passes[i].stages.length; ++j)
                    {
                        const
                            stageRes = technique.passes[i].stages[j],
                            stage = {};

                        stage.constantBuffer = new Float32Array(stageRes.constantSize);
                        stage.reroutedParameters = [];
                        stage.parameters = [];
                        stage.textures = [];
                        stage.constantBuffer.set(stageRes.constantValues);

                        const { constantBuffer } = stage;

                        for (let k = 0; k < stageRes.constants.length; ++k)
                        {
                            if (Tw2Effect.ConstantIgnore.includes(stageRes.constants[k].name))
                            {
                                continue;
                            }

                            const { name, type, offset, size, isAutoregister, elements } = stageRes.constants[k];
                            let parameter;

                            if (name in this.parameters)
                            {
                                parameter = this.parameters[name];
                                try
                                {
                                    if (parameter.Bind(constantBuffer, offset, size))
                                    {
                                        stage.reroutedParameters.push(parameter);
                                    }
                                    else
                                    {
                                        stage.parameters.push({ parameter, constantBuffer, offset, size });
                                    }
                                }
                                catch(err)
                                {
                                    console.dir({ effect: this, parameter });
                                }
                            }
                            else if (tw2.HasVariable(name))
                            {
                                stage.parameters.push({
                                    parameter: tw2.GetVariable(name),
                                    constantBuffer,
                                    offset,
                                    size
                                });
                            }
                            else if (isAutoregister && type)
                            {
                                // TODO: Map constant enums to internal type strings
                                parameter = tw2.CreateVariable(name, undefined, type);
                                if (parameter)
                                {
                                    this.parameters[name] = parameter;
                                    stage.parameters.push({ parameter, constantBuffer, offset, size });
                                }
                            }
                            else if (this.autoParameter && elements === 1)
                            {
                                let value = stage.constantBuffer.subarray(offset, offset + size);
                                if (value.length === 0)
                                {
                                    value = undefined;
                                }
                                else if (value.length === 1)
                                {
                                    value = value[0];
                                }

                                parameter = tw2.CreateVariable(name, value, type);
                                if (parameter)
                                {
                                    this.parameters[name] = parameter;
                                    if (parameter.Bind(constantBuffer, offset, size))
                                    {
                                        stage.reroutedParameters.push(parameter);
                                    }
                                    else
                                    {
                                        stage.parameters.push({ parameter, constantBuffer, offset, size });
                                    }
                                }
                            }

                            if (parameter)
                            {
                                parameter.usedByCurrentEffect = true;
                            }
                        }

                        for (let k = 0; k < stageRes.textures.length; ++k)
                        {
                            const { name, isAutoregister } = stageRes.textures[k];

                            let texture = null;
                            if (name in this.parameters)
                            {
                                texture = this.parameters[name];
                            }
                            else if (tw2.HasVariable(name))
                            {
                                texture = tw2.GetVariable(name);
                            }
                            else if (isAutoregister)
                            {
                                texture = this.parameters[name] = tw2.CreateVariable(name, undefined, Tw2TextureParameter);
                            }
                            else if (this.autoParameter)
                            {
                                texture = this.parameters[name] = new Tw2TextureParameter(name);
                            }

                            if (texture)
                            {
                                texture.usedByCurrentEffect = true;
                            }
                            else
                            {
                                continue;
                            }

                            const textureDefinition = stageRes.textures[k];
                            const pairedSampler = textureDefinition._sampler || null;
                            const p = {
                                parameter: texture,
                                slot: textureDefinition.registerIndex,
                                sampler: null
                            };

                            for (let n = 0; n < stageRes.samplers.length; ++n)
                            {
                                const { registerIndex, name } = stageRes.samplers[n];

                                if (samplerOverrideNames.indexOf(name) === -1)
                                {
                                    if (!this.samplerOverrides[name])
                                    {
                                        this.samplerOverrides[name] = null;
                                    }
                                    samplerOverrideNames.push(name);
                                    samplerOverrideNames.sort();
                                }

                                if (stageRes.samplers[n] === pairedSampler || (!pairedSampler && registerIndex === p.slot))
                                {
                                    if (name in this.samplerOverrides && this.samplerOverrides[name])
                                    {
                                        const override = this.samplerOverrides[name];
                                        p.sampler = override.GetSampler(stageRes.samplers[n]);
                                        override.usedByCurrentEffect = true;
                                    }
                                    else
                                    {
                                        p.sampler = stageRes.samplers[n];
                                        this.samplerOverrides[name] = null;
                                    }
                                    break;
                                }
                            }

                            if (j === 0) p.slot += 12;
                            stage.textures.push(p);
                        }
                        pass.stages.push(stage);
                    }
                    passes.push(pass);
                }
                this.techniques[techniqueName] = passes;
            }
        }

        // Prune anything the CURRENT permutation doesn't use. This is the
        // "CleanEffect" half of parameter management and it DELETES, so it
        // must only run on a deliberate clean (PopulateParameters/
        // CleanEffect), never on a passive bind. autoParameter on its own
        // means "auto-create & keep": a passive bind (e.g. OnResPrepared
        // after SetValue, or a transient default-permutation bind on a
        // cached reload) must not delete externally-assigned parameters
        // like a SOF-applied PatternMask1Map before the intended
        // permutation is even bound.
        if (this.autoParameter && opt && opt.cleanUnused)
        {
            // Remove unnecessary parameters and textures
            for (const key in this.parameters)
            {
                if (this.parameters.hasOwnProperty(key))
                {
                    const param = this.parameters[key];
                    if (!param)
                    {
                        Reflect.deleteProperty(this.parameters, key);
                    }
                    else if (!param.usedByCurrentEffect)
                    {
                        Reflect.deleteProperty(this.parameters, key);
                    }
                }
            }

            // Remove unnecessary overrides
            for (const key in this.samplerOverrides)
            {
                if (this.samplerOverrides.hasOwnProperty(key))
                {
                    const override = this.samplerOverrides[key];
                    if (!override)
                    {
                        if (samplerOverrideNames.indexOf(key) === -1)
                        {
                            Reflect.deleteProperty(this.samplerOverrides, key);
                        }
                    }
                    else if (!override.usedByCurrentEffect)
                    {
                        Reflect.deleteProperty(this.samplerOverrides, key);
                    }
                }
            }
        }

        this._SyncEffectResAdapters();

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("modified", this, opt);
            // TODO: Shouldn't this just be "rebuilt" ?
            this.EmitEvent("rebuilt", this, opt);
        }

        if (device["effectObserver"])
        {
            device["effectObserver"]["OnEffectChanged"](this);
        }

        return true;
    }

    /**
     * ApplyPass
     * @param technique {String} - technique name
     * @param pass {Number}
     */
    ApplyPass(technique, pass)
    {
        if (!this.IsGood() || !(technique in this.techniques) || pass >= this.techniques[technique].length)
        {
            return;
        }

        if (!this.techniques[technique][pass] || !this.shader.techniques[technique] || !this.shader.techniques[technique].passes || !this.shader.techniques[technique].passes[pass])
        {
            console.debug({ pass, technique, shader: this.shader, effect: this });
            return;
        }

        const
            p = this.techniques[technique][pass],
            rp = this.shader.techniques[technique].passes[pass],
            d = device,
            gl = d.gl;

        let program = (d.IsAlphaTestEnabled() && rp.shadowShaderProgram) ? rp.shadowShaderProgram : rp.shaderProgram;
        const context = {
            effect: this,
            effectRes: this.effectRes,
            technique,
            pass,
            passState: p,
            renderPass: rp,
            stages: p.stages,
            program,
            gl,
            device: d,
            perObjectData: d.perObjectData,
            perFrameVSData: null,
            perFramePSData: null,
            cewgPerObjectPacker: null,
            cewgJointMatrices: undefined,
            constantBufferHandles: program.constantBufferHandles
        };

        this._RunAdapterHook("OnBeforeApplyPass", context);
        this.shader.ApplyPass(technique, pass, p.state);

        program = (d.IsAlphaTestEnabled() && rp.shadowShaderProgram) ? rp.shadowShaderProgram : rp.shaderProgram;
        context.program = program;
        context.constantBufferHandles = program.constantBufferHandles;
        this._RunAdapterHook("OnAfterApplyPass", context);

        for (let i = 0; i < 2; ++i)
        {
            const stages = p.stages[i];

            for (let j = 0; j < stages.parameters.length; ++j)
            {
                let pp = stages.parameters[j];
                pp.parameter.Apply(pp.constantBuffer, pp.offset, pp.size);
            }

            for (let j = 0; j < stages.textures.length; ++j)
            {
                let tex = stages.textures[j];
                // CEWG sampler registers past the 16-unit limit are remapped to
                // free low units (Tw2ShaderProgram.SetupCewgSamplerUnits); bind
                // to that unit so it matches the shader's uniform1i. In-range
                // registers have no map entry and bind to unit == register.
                const unit = program.cewgSamplerUnits ? (program.cewgSamplerUnits.get(tex.slot) ?? tex.slot) : tex.slot;
                tex.parameter.Apply(unit, tex.sampler, program.volumeSlices[tex.sampler.registerIndex]);
            }
        }

        this._RunAdapterHook("OnAfterApplyParameters", context);

        const cbh = program.constantBufferHandles;
        const pod = d.perObjectData;
        context.perObjectData = pod;
        context.perFrameVSData = pod && pod.perFrameVSData || d.perFrameVSData;
        context.perFramePSData = pod && pod.perFramePSData || d.perFramePSData;
        // vertex constants
        if (cbh[0]) gl.uniform4fv(cbh[0], p.stages[0].constantBuffer);
        // Fragment constants
        if (cbh[7]) gl.uniform4fv(cbh[7], p.stages[1].constantBuffer);

        // CEWG shaders were compiled against Carbon's DX11 b1-b4
        // layouts — their per-frame/per-object uploads are packed by
        // the binder instead of the raw GLES-shaped arrays below.
        if (rp.isCewg)
        {
            const podPacker = context.perObjectData && context.perObjectData.cewgPerObjectPacker;
            if (podPacker && !this._adapters.includes(podPacker) && podPacker.OnBeforeCewgConstants)
            {
                podPacker.OnBeforeCewgConstants(context);
            }
            // Adapters can set context.cewgPerObjectPacker to provide
            // PackPerObjectVS/PS without teaching the space packer about
            // object-family-specific cb3/cb4 layouts.
            this._RunAdapterHook("OnBeforeCewgConstants", context);
            CewgResourceBinder.Get(d).ApplyConstants(program, d, context.cewgPerObjectPacker, context);
            this._RunAdapterHook("OnAfterCewgConstants", context);
        }
        // Surely a better way to do this...
        else if (this._isShadowEffect)
        {
            if (d.perFrameShadowVSData && cbh[1]) gl.uniform4fv(cbh[1], d.perFrameShadowVSData.data);
            if (d.perFrameShadowPSData && cbh[2]) gl.uniform4fv(cbh[2], d.perFrameShadowPSData.data);
        }
        else
        {
            if (context.perFrameVSData && cbh[1]) gl.uniform4fv(cbh[1], context.perFrameVSData.data);
            if (context.perFramePSData && cbh[2]) gl.uniform4fv(cbh[2], context.perFramePSData.data);
        }

        this._RunAdapterHook("OnAfterPerFrameData", context);

        if (pod && !rp.isCewg)
        {
            if (pod.vs && cbh[3]) gl.uniform4fv(cbh[3], pod.vs.data);
            if (pod.ps && cbh[4]) gl.uniform4fv(cbh[4], pod.ps.data);
            if (pod.psInt && program.intConstantHandles)
            {
                for (let j = 0; j < program.intConstantHandles.length; j++)
                {
                    const handle = program.intConstantHandles[j];
                    if (handle) gl.uniform4iv(handle, pod.psInt.subarray(j * 4, j * 4 + 4));
                }
            }
            if (pod.ffe && cbh[5]) gl.uniform4fv(cbh[5], pod.ffe.data);
        }

        this._RunAdapterHook("OnAfterPerObjectData", context);

        // CEWG passes carry non-sampler bindings (bone UBO, light-list
        // data textures, post-fx buffer textures) the legacy uniform
        // upload above knows nothing about.
        if (rp.isCewg)
        {
            const binder = CewgResourceBinder.Get(d);
            const jointMatrices = context.cewgJointMatrices !== undefined
                ? context.cewgJointMatrices
                : (pod && pod.vs && pod.vs.Has("JointMat") ? pod.vs.Get("JointMat") : null);
            binder.SetJointMatrices(jointMatrices);
            binder.ApplyPass(program, d);
        }

        this._RunAdapterHook("OnBeforeDraw", context);

    }

    /**
     * GetPassCount
     * @param technique {String} - technique name
     * @returns {Number}
     */
    GetPassCount(technique)
    {
        return !this.HasTechnique(technique) ? 0 : this.techniques[technique].length;
    }

    /**
     * GetPassInput
     * @param technique {String} - technique name
     * @param {Number} pass
     * @returns {*}
     */
    GetPassInput(technique, pass)
    {
        if (!this.HasTechnique(technique) || pass >= this.techniques[technique].length)
        {
            return null;
        }

        if (device.IsAlphaTestEnabled() && this.shader.techniques[technique].passes[pass].shadowShaderProgram)
        {
            return this.shader.techniques[technique].passes[pass].shadowShaderProgram.input;
        }
        else
        {
            return this.shader.techniques[technique].passes[pass].shaderProgram.input;
        }
    }

    /**
     * Render
     * @param {function} cb - callback
     * @param {String} [technique]
     */
    Render(cb, technique)
    {
        const count = this.GetPassCount(technique);
        for (let i = 0; i < count; ++i)
        {
            this.ApplyPass(technique, i);
            cb(this, i);
        }
    }

    /**
     * * Gets flattened texture values
     * @param {{}} [out={}]
     * @return {{}}
     */
    GetTextures(out = {})
    {
        return Tw2Effect.getParameterObject(this.parameters, out, true, false, true);
    }


    /**
     * Gets flattened parameter values
     * @param {{}} [out={}]
     * @return {{}}
     */
    GetParameters(out = {})
    {
        return Tw2Effect.getParameterObject(this.parameters, out, false, true, true);
    }

    /**
     * Gets flattened texture override values
     * @param {{}} [out={}]
     * @return {{}}
     */
    GetOverrides(out = {})
    {
        return Tw2Effect.getParameterObject(this.parameters, out, true, true, false);
    }

    /**
     * Sets textures from flattened values
     * @param {{}} values            - the values to set
     * @param {Boolean} [skipUpdate] - skips updating the effect
     * @return {boolean}             - true if updated
     */
    SetTextures(values = {}, skipUpdate)
    {
        const updated = Tw2Effect.setParameterObject(this.parameters, values, true, false, true);
        if (updated && !skipUpdate) this.UpdateValues();
        return updated;
    }

    /**
     * Sets parameters from flattened values
     * - This will set any type of parameter, texture or override parameter
     * @param {{}} values            - the values to set
     * @param {Boolean} [skipUpdate] - skips updating the effect
     * @return {boolean}             - true if updated
     */
    SetParameters(values = {}, skipUpdate)
    {
        const updated = Tw2Effect.setParameterObject(this.parameters, values);
        if (updated && !skipUpdate) this.UpdateValues();
        return updated;
    }

    /**
     * Sets texture overrides from flattened values
     * @param {{}} values            - the values to set
     * @param {Boolean} [skipUpdate] - skips updating the effect
     * @return {boolean}             - true if updated
     */
    SetOverrides(values = {}, skipUpdate)
    {
        const updated = Tw2Effect.setParameterObject(this.parameters, Tw2Effect.getNormalizedOverrides(values), true, true, false);
        if (updated && !skipUpdate) this.UpdateValues();
        return updated;
    }

    /**
     * Sets sampler overrides on the effect. These are real Tw2SamplerOverride
     * objects living in this.samplerOverrides, keyed by the shader's sampler
     * name (e.g. "DecalAlbedoMapSampler"), and are resolved into each texture's
     * bound sampler by BindParameters. This is the proper home for sampler
     * overrides - the per-Tw2TextureParameter `overrides` path is legacy.
     * @param {Object} [values]      - map of <samplerName>: (values|Tw2SamplerOverride|null)
     * @param {Boolean} [skipUpdate] - skips re-binding the effect
     * @return {Boolean}             - true if updated
     */
    SetSamplerOverrides(values = {}, skipUpdate)
    {
        let updated = false;

        for (const key in values)
        {
            if (!values.hasOwnProperty(key)) continue;

            // Sampler overrides are named "<TextureName>Sampler"
            const name = key.lastIndexOf("Sampler") === key.length - 7 ? key : key + "Sampler";
            const value = values[key];

            // Null removes the override (falls back to the shader's sampler)
            if (value === null || value === undefined)
            {
                if (this.samplerOverrides[name])
                {
                    this.samplerOverrides[name] = null;
                    updated = true;
                }
                continue;
            }

            if (value instanceof Tw2SamplerOverride)
            {
                value.name = value.name || name;
                this.samplerOverrides[name] = value;
                updated = true;
                continue;
            }

            let override = this.samplerOverrides[name];
            if (!(override instanceof Tw2SamplerOverride))
            {
                override = this.samplerOverrides[name] = new Tw2SamplerOverride();
                override.name = name;
                updated = true;
            }

            if (override.SetValues(value, { skipUpdate: true })) updated = true;
        }

        if (updated && !skipUpdate && this.IsGood())
        {
            // BindParameters re-resolves each texture's bound sampler against
            // the current samplerOverrides; a passive bind (no clean) keeps the
            // overrides we just set. When the effect isn't good yet the pending
            // overrides are applied by the next bind (e.g. OnResPrepared).
            this.BindParameters();
        }

        return updated;
    }

    /**
     * Adds effect parameters automatically (Graphite/Jessica's
     * "CleanParameters"): creates a parameter/texture for everything the
     * shader's stages declare. Re-resolves the shader from the effect's
     * current `options` first, so option changes (permutation selection)
     * made since the last build are respected - without this, the
     * population would walk the stale shader's stages and never see
     * permutation-gated inputs (e.g. pattern maps).
     * @param {Object} [opt]
     */
    PopulateParameters(opt)
    {
        return this.AutoPopulate(true, opt);
    }

    /**
     * Auto-creates the parameters the current permutation declares and,
     * when autoClean is set, prunes the ones it does NOT use (Graphite's
     * CleanEffect).
     *
     * autoClean separates the two behaviours ccpwgl used to conflate on the
     * single `autoParameter` flag:
     *  - create & keep (autoClean=false): guess the parameters the shader
     *    declares, but keep everything already assigned.
     *  - clean (autoClean=true): additionally DELETE parameters the current
     *    permutation doesn't use.
     *
     * Only the clean pass deletes, so it must be a deliberate call. A
     * passive bind - OnResPrepared after SetValue, or a transient default-
     * permutation bind on a cached reload - must never clean, or it drops
     * externally-assigned parameters (e.g. a SOF-applied PatternMask1Map)
     * before the intended permutation is bound. Correct order of operations
     * for a permutation-gated swap is: SetOption(...) first, then SetValue,
     * then AutoPopulate() once.
     *
     * @param {Boolean} [autoClean=true]
     * @param {Object} [opt]
     */
    AutoPopulate(autoClean = true, opt)
    {
        this.autoParameter = true;
        const o = autoClean ? { ...opt, cleanUnused: true } : opt;
        if (!this.Rebind(o)) this.BindParameters(o);
    }

    /**
     * Graphite-style CleanEffect: create the current permutation's
     * parameters and prune the rest. Alias of AutoPopulate(true).
     * @param {Object} [opt]
     */
    CleanEffect(opt)
    {
        return this.AutoPopulate(true, opt);
    }

    /**
     * Sets one or more permutation options.
     *
     * By default this repopulates (rebuilds the shader for the new
     * permutation) so the change takes effect immediately. Pass
     * autoPopulate=false to batch several option changes without rebuilding
     * - set every option first, THEN Rebind()/PopulateParameters() once.
     * This is the correct order of operations when swapping an effect to a
     * permutation-gated shader: set the options before the resource binds,
     * so the intended permutation is chosen from the first bind and no
     * transient default-permutation bind is needed.
     *
     * @param {Object} options - e.g. { SPACE_OBJECT_PPT_ENABLED: "SOPPT_ENABLED" }
     * @param {Boolean} [autoPopulate=true] - rebuild after setting
     * @returns {Boolean} true if any option value changed
     */
    SetOption(options, autoPopulate = true)
    {
        let changed = false;
        for (const name in options)
        {
            if (!options.hasOwnProperty(name)) continue;
            if (this.options[name] !== options[name])
            {
                this.options[name] = options[name];
                changed = true;
            }
        }
        if (changed && autoPopulate) this.PopulateParameters();
        return changed;
    }

    /**
     * Checks whether the effect's shader exposes a named permutation option,
     * e.g. "BLEND_MODE". Used by the graph-wide `GetEffectsWithOption` walk.
     * @param {String} option
     * @returns {Boolean}
     */
    HasOption(option)
    {
        const permutations = this.effectRes && this.effectRes.permutations;
        if (Array.isArray(permutations))
        {
            for (let i = 0; i < permutations.length; i++)
            {
                if (permutations[i] && permutations[i].name === option) return true;
            }
        }
        return false;
    }

    /**
     * Fires a function per child
     * @param {Function} func
     * @param {Boolean} [includeEmpty]
     * @returns {*}
     */
    PerChild(func, includeEmpty)
    {
        const rv = super.PerChild(func, includeEmpty);
        if (rv !== undefined) return rv;

        const parent = this.parameters;
        for (const key in parent)
        {
            if (parent.hasOwnProperty(key))
            {
                const rv = func({ struct: parent[key], parent, key, path: `/parameters/${key}` });
                if (rv !== undefined) return rv;
            }
        }
    }

    /**
     * Handles listeners added after an event has already been fired
     * @param {Tw2Effect} effect
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @return {boolean} true if the listener was fired
     */
    static onListener(effect, eventName, listener, context)
    {
        if (eventName === "rebuilt" && effect.IsGood())
        {
            listener.call(context, effect, effect.effectRes);
            return true;
        }

        return Tw2Resource.parentOnListener(effect, "effectRes", eventName, listener, context);
    }

    /**
     * Sets an effect from a plain object
     * @param {Tw2Effect} a
     * @param {Tw2EffectRes} a.effectRes
     * @param {Object} [values]
     * @param {Object} [opt={}]
     * @returns {boolean} true if updated
     */
    static set(a, values, opt = {})
    {
        if (!values) return false;

        const { parameters, textures, overrides, samplerOverrides, options, effectFilePath = "" } = values;

        let updated = assignIfExists(a, values, [ "name", "display", "autoParameter" ]);

        if (parameters && a.SetParameters(parameters, true)) updated = true;
        if (overrides && a.SetOverrides(overrides, true)) updated = true;
        if (samplerOverrides && a.SetSamplerOverrides(samplerOverrides, true)) updated = true;
        if (textures && a.SetTextures(textures, true)) updated = true;

        if (options)
        {
            const normalizedOptions = Tw2Effect.normalizeOptions(options);
            // TODO: Check if options and current options are the same
            a.options = normalizedOptions;

            if (a.effectRes)
            {
                a.shader = a.effectRes.GetShader(a.options);
                if (a.shader)
                {
                    a.BindParameters({ controller: a.effectRes, skipEvents: opt.skipEvents });
                }
            }

            updated = true;
        }

        if (effectFilePath && a.effectFilePath !== effectFilePath)
        {
            a.effectFilePath = effectFilePath.toLowerCase();
            updated = true;
        }

        if (updated && !opt.skipUpdate)
        {
            a.UpdateValues(opt);
        }

        return updated;
    }

    /**
     * Creates an effect from values
     * @param {Object|String} values
     * @param {Object} [opt]
     * @returns {*}
     */
    static from(values, opt)
    {
        if (isString(values))
        {
            values = { effectFilePath: values, autoParameter: true };
        }

        return super.from(values, opt);
    }

    /**
     * Serializes an effect
     * @param {Tw2Effect} a
     * @param {Object} [out={}]
     * @returns {Object} out
     */
    static get(a, out = {})
    {
        assignIfExists(out, a, [ "name", "display", "effectFilePath", "autoParameter" ]);
        out.parameters = a.GetParameters();
        out.textures = a.GetTextures();
        out.overrides = a.GetOverrides();
        out.samplerOverrides = a.GetSamplerOverrides();
        out.options = Object.assign({}, a.options);
        out.permutations = a.GetPermutations();
        return out;
    }

    /**
     * Normalizes effect options to the object shape expected by GetShader
     * @param {Object|Array<{name: string, value: string}>} [options]
     * @returns {Object}
     */
    static normalizeOptions(options)
    {
        if (!options)
        {
            return {};
        }

        if (Array.isArray(options))
        {
            const out = {};
            for (let i = 0; i < options.length; i++)
            {
                const option = options[i];
                if (option && option.name)
                {
                    out[option.name] = option.value;
                }
            }
            return out;
        }

        return Object.assign({}, options);
    }

    /**
     * Gets the effect's sampler overrides as plain values
     * @param {Object} [out={}]
     * @returns {Object}
     */
    GetSamplerOverrides(out = {})
    {
        for (const name in this.samplerOverrides)
        {
            if (!this.samplerOverrides.hasOwnProperty(name)) continue;
            const override = this.samplerOverrides[name];
            if (!override) continue;
            out[name] = typeof override.GetValues === "function" ? override.GetValues() : override;
        }
        return out;
    }

    /**
     * Gets a json snapshot of the full compiled shader setup for the current
     * permutation: techniques, passes, permutations/options, annotations, shader
     * states, stages and stage data. Returns undefined when there is no effect
     * resource or compiled shader.
     * @returns {Object|undefined}
     */
    GetShaderValues()
    {
        if (!this.effectRes || !this.shader) return undefined;

        const shader = this.shader;
        const values = (item) => (item && typeof item.GetValues === "function") ? item.GetValues() : item;

        const getStage = (stage) =>
        {
            if (!stage) return null;
            const input = stage.inputDefinition;
            return {
                type: stage.type,
                typeName: stage.constructor && stage.constructor.Type ? getKeyFromValue(stage.constructor.Type, stage.type) : undefined,
                shaderCode: stage.shaderCode,
                constantSize: stage.constantSize,
                constantValues: stage.constantValues ? Array.from(stage.constantValues) : null,
                constants: (stage.constants || []).map(values),
                textures: (stage.textures || []).map(values),
                samplers: (stage.samplers || []).map(values),
                inputDefinition: input ? {
                    stride: input.stride,
                    elements: (input.elements || []).map((e) => ({
                        usage: e.usage,
                        usageIndex: e.usageIndex,
                        type: e.type,
                        elements: e.elements,
                        offset: e.offset,
                        location: e.location,
                        registerIndex: e._registerIndex,
                        usedMask: e._usedMask
                    }))
                } : null,
                cewgBindings: (stage.cewgBindings && stage.cewgBindings.length) ? stage.cewgBindings : undefined
            };
        };

        const getPass = (pass) => ({
            hasProgram: !!pass.shaderProgram,
            hasShadowProgram: !!pass.shadowShaderProgram,
            states: (pass.states || []).map(values),
            stages: (pass.stages || []).map(getStage)
        });

        const techniques = {};
        for (const name in shader.techniques)
        {
            if (!shader.techniques.hasOwnProperty(name)) continue;
            const technique = shader.techniques[name];
            techniques[name] = {
                name: technique.name,
                passes: (technique.passes || []).map(getPass)
            };
        }

        return {
            effectFilePath: this.effectFilePath,
            options: Object.assign({}, this.options),
            permutations: this.GetPermutations(),
            annotations: Object.assign({}, shader.annotations),
            techniques
        };
    }

    /**
     * Gets effect permutation metadata from the effect resource
     * @returns {Array}
     */
    GetPermutations()
    {
        if (!this.effectRes || !Array.isArray(this.effectRes.permutations))
        {
            return [];
        }

        return this.effectRes.permutations.map((permutation) => ({
            name: permutation.name,
            options: Tw2Effect.getPermutationOptions(permutation.options),
            defaultOption: permutation.defaultOption,
            description: permutation.description || "",
            type: permutation.type
        }));
    }

    /**
     * Gets a plain option list from a permutation option store
     * @param {Array|Object} [options]
     * @returns {Array}
     */
    static getPermutationOptions(options)
    {
        if (!options)
        {
            return [];
        }

        if (Array.isArray(options))
        {
            return Array.from(options);
        }

        return Object.keys(options).sort((a, b) => options[a] - options[b]);
    }

    /**
     * Gets a permutation's default option name, handling both record
     * shapes (legacy Tw2ShaderPermutation's name->index object and CEWG's
     * plain string array)
     * @param {Tw2ShaderPermutation|Object} permutation
     * @returns {String|undefined}
     */
    static getPermutationDefaultOption(permutation)
    {
        return Tw2Effect.getPermutationOptions(permutation.options)[permutation.defaultOption || 0];
    }

    /**
     * Gets parameter values as a plain object
     * @param {*} source
     * @param {*} out
     * @param {Boolean} [excludeParameters]
     * @param {Boolean} [excludeTextures]
     * @param {Boolean} [excludeOverrides]
     * @return {{}}
     */
    static getParameterObject(source, out, excludeParameters, excludeTextures, excludeOverrides)
    {
        for (const key in source)
        {
            if (source.hasOwnProperty(key))
            {
                if (source[key] instanceof Tw2TextureParameter)
                {
                    if (!excludeOverrides)
                    {
                        out[key + "Sampler"] = source[key].GetOverrides() || null;
                    }

                    if (!excludeTextures)
                    {
                        out[key] = source[key].GetValue();
                    }
                }
                else if (!excludeParameters)
                {
                    out[key] = source[key].GetValue([]);
                }
            }
        }
        return out;
    }

    /**
     * Temporary function which ensures overrides have "Sampler" in their name
     * TODO: Remove the need for this
     * @param {*} [values={}]
     * @returns {*}
     */
    static getNormalizedOverrides(values = {})
    {
        const out = {};
        for (const key in values)
        {
            if (values.hasOwnProperty(key))
            {
                if (key.indexOf("Sampler") !== key.length - 7)
                {
                    out[key + "Sampler"] = values[key];
                }
                else
                {
                    out[key] = values[key];
                }
            }
        }
        return out;
    }

    /**
     * Sets parameter values from an object
     * @param {*} target
     * @param {*} src
     * @param {Boolean} [excludeParameters]
     * @param {Boolean} [excludeTextures]
     * @param {Boolean} [excludeOverrides]
     * @return {boolean}
     */
    static setParameterObject(target, src, excludeParameters, excludeTextures, excludeOverrides)
    {
        let updated = false;
        for (let key in src)
        {
            if (src.hasOwnProperty(key) && src[key] !== undefined)
            {
                const value = src[key];

                // Catch texture overrides
                let isOverride = false;
                if (isPlain(value) || key.includes("Sampler") && key.lastIndexOf("Sampler") === key.length - 7)
                {
                    key = key.replace("Sampler", "");
                    isOverride = true;
                }

                if (key in target)
                {
                    if (target[key] instanceof Tw2TextureParameter)
                    {
                        if (isOverride)
                        {
                            if (!excludeOverrides)
                            {
                                if (value === null)
                                {
                                    target[key].RemoveOverrides();
                                    updated = true;
                                }
                                else if (target[key].SetOverrides(value))
                                {
                                    updated = true;
                                }
                            }
                        }
                        else if (!excludeTextures)
                        {
                            if (value === null)
                            {
                                target[key].Destroy();
                                Reflect.delete(target, key);
                                updated = true;
                            }
                            else if (!excludeTextures && target[key].SetValue(value))
                            {
                                updated = true;
                            }
                        }
                    }
                    else if (!excludeParameters)
                    {
                        if (value === null)
                        {
                            target[key].Destroy();
                            Reflect.delete(target, key);
                            updated = true;
                        }
                        else if (target[key].SetValue(value))
                        {
                            updated = true;
                        }
                    }
                }
                else if (value !== null)
                {
                    if (isOverride)
                    {
                        if (!excludeOverrides)
                        {
                            target[key] = new Tw2TextureParameter(key);
                            target[key].SetOverrides(value);
                            updated = true;
                        }
                    }
                    else
                    {
                        const param = tw2.CreateVariable(key, value);

                        if (param instanceof Tw2TextureParameter)
                        {
                            if (!excludeTextures && param)
                            {
                                target[key] = param;
                                updated = true;
                            }
                        }
                        else if (!excludeParameters)
                        {
                            target[key] = param;
                            updated = true;
                        }
                    }
                }
            }
        }

        return updated;
    }

    /**
     * Constant parameters which are ignored when creating an effect
     * @type {String[]}
     */
    static ConstantIgnore = [
        "PerFrameVS",
        "PerObjectVS",
        "PerFramePS",
        "PerObjectPS",
        "PerObjectPSInt"
    ];

    static blackReaders = {

        parameters: fromList({ key: "name" }),

        options: fromList({
            key: "name",
            value: "value",
            struct: Tw2EffectOption
        }),

        samplerOverrides: fromList({
            key: "name",
            reroute: "samplerOverrides",
            struct: Tw2SamplerOverride
        }),

        resources: fromList({
            key: "name",
            reroute: "parameters"
        }),

        constParameters: fromList({
            key: "name",
            reroute: "parameters",
            struct: Tw2ConstantParameter
        })

    };

}
