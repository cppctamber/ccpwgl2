import { meta, assignIfExists, getPathExtension, isPlain, isString } from "utils";
import { device, tw2 } from "global";
import { Tw2TextureParameter } from "../parameter/Tw2TextureParameter";
import { Tw2Vector4Parameter } from "../parameter/Tw2Vector4Parameter";
import { fromList } from "core/reader/Tw2BlackPropertyReaders";
import { Tw2Resource } from "core/resource";
import { getOverriddenShaderPath } from "../../../shaders";
import { Tw2SamplerState } from "core";


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


@meta.type("Tw2Effect")
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

    _isAttached = false;

    //resources
    //constParameters

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
                if (getPathExtension(this.effectFilePath) !== "sm_json") this.effectFilePath = Tw2Effect.getOverriddenShaderPath(this.effectFilePath);
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

    /**
     * Temporary handler for unpacked textures
     * @param {String} path
     * @returns {String}
     */
    static getOverriddenShaderPath(path)
    {
        return this.UNPACKED_TEXTURES ? getOverriddenShaderPath(path) : path;
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
            return false;
        }

        this.UnBindParameters({ skipEvents: true });

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
                                        stage.parameter.push({ parameter, constantBuffer, offset, size });
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

                            const p = {
                                parameter: texture,
                                slot: stageRes.textures[k].registerIndex,
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

                                if (registerIndex === p.slot)
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

        // Automatically removes unused parameters
        if (this.autoParameter)
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

        this.shader.ApplyPass(technique, pass, this.techniques[technique][pass].state);

        const
            p = this.techniques[technique][pass],
            rp = this.shader.techniques[technique].passes[pass],
            d = device,
            gl = d.gl;

        const program = (d.IsAlphaTestEnabled() && rp.shadowShaderProgram) ? rp.shadowShaderProgram : rp.shaderProgram;

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
                tex.parameter.Apply(tex.slot, tex.sampler, program.volumeSlices[tex.sampler.registerIndex]);
            }
        }

        const cbh = program.constantBufferHandles;
        // vertex constants
        if (cbh[0]) gl.uniform4fv(cbh[0], p.stages[0].constantBuffer);
        // Fragment constants
        if (cbh[7]) gl.uniform4fv(cbh[7], p.stages[1].constantBuffer);

        if (d.perFrameVSData && cbh[1]) gl.uniform4fv(cbh[1], d.perFrameVSData.data);
        if (d.perFramePSData && cbh[2]) gl.uniform4fv(cbh[2], d.perFramePSData.data);
        const pod = d.perObjectData;
        if (pod)
        {
            if (pod.vs && cbh[3]) gl.uniform4fv(cbh[3], pod.vs.data);
            if (pod.ps && cbh[4]) gl.uniform4fv(cbh[4], pod.ps.data);
            if (pod.ffe && cbh[5]) gl.uniform4fv(cbh[5], pod.ffe.data);
        }

        if (d.perFrameCustomSceneVSData && cbh[8]) gl.uniform4fv(cbh[8], d.perFrameCustomSceneVSData.data);
        if (d.perFrameCustomScenePSData && cbh[9]) gl.uniform4fv(cbh[9], d.perFrameCustomScenePSData.data);

        //if (d.perFrameCustomObjectVSData && cbh[10]) gl.uniform4fv(cbh[10], d.perFrameCustomObjectVSData.data);
        //if (d.perFrameCustomObjectVSData && cbh[11]) gl.uniform4fv(cbh[11], d.perFrameCustomObjectVSData.data);

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
     * Adds effect parameters automatically
     * @param {Object} [opt]
     */
    PopulateParameters(opt)
    {
        this.autoParameter = true;
        this.BindParameters(opt);
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

        const { parameters, textures, overrides, options, effectFilePath = "" } = values;

        let updated = assignIfExists(a, values, [ "name", "display", "autoParameter" ]);

        if (parameters && a.SetParameters(parameters, true)) updated = true;
        if (overrides && a.SetOverrides(overrides, true)) updated = true;
        if (textures && a.SetTextures(textures, true)) updated = true;

        if (options)
        {
            // TODO: Check if options and current options are the same
            a.options = Object.assign(options);

            if (a.effectRes)
            {
                a.shader = a.effectRes.GetShader(options);
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
        out.options = Object.assign(a.options);
        return out;
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
            struct: TemporaryBinaryReader
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
