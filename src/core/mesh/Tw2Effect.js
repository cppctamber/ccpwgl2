import { meta, assignIfExists, getPathExtension, isPlain } from "utils";
import { device, tw2 } from "global";
import { Tw2TextureParameter } from "../parameter/Tw2TextureParameter";
import { Tw2Vector4Parameter } from "../parameter/Tw2Vector4Parameter";
import { fromList } from "core/reader/Tw2BlackPropertyReaders";
import { Tw2Resource } from "core/resource";


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

    @meta.boolean
    autoParameter = false;


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
     * Sets parameters from a sof material
     * @param {EveSOFDataMaterial} material
     * @param {Number} index
     * @return {boolean}
     */
    SetSOFDataMaterial(material, index)
    {
        const { parameters } = material;

        let prefix;

        switch (index)
        {
            case 1:
            case 2:
            case 3:
            case 4:
                prefix = "Mtl" + index;
                break;

            case 5:
            case 6:
                prefix = "PMtl" + index - 4;
                break;

            default:
                throw new Error("Invalid material index");
        }

        const values = {};

        for (const key in parameters)
        {
            if (parameters.hasOwnProperty(key))
            {
                if (prefix + key in this)
                {
                    values[prefix + key] = Array.from(parameters[key].value);
                }
            }
        }

        return this.SetParameters(values);
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
     * @param {Object} opt
     */
    OnValueChanged(opt)
    {
        let res;

        if (this.isAttached)
        {
            res = this.effectRes;
        }
        else
        {
            this.effectFilePath = this.effectFilePath ? this.effectFilePath.toLowerCase() : "";

            // Auto fx quality
            const extension = getPathExtension(this.effectFilePath);
            if (extension === "fx") this.effectFilePath = device.ToEffectPath(this.effectFilePath);

            res = this.effectFilePath ? tw2.GetResource(this.effectFilePath) : null;
        }

        if (!this._SetEffectRes(res))
        {
            this.BindParameters();
        }
    }

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
            this.BindParameters();
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
     * Unbinds parameters
     * @returns {Boolean}
     */
    UnBindParameters()
    {
        for (let t in this.techniques)
        {
            if (this.techniques.hasOwnProperty(t))
            {
                let technique = this.techniques[t];
                for (let i = 0; i < technique.length; ++i)
                {
                    for (let j = 0; j < technique[i].stages.length; ++j)
                    {
                        for (let k = 0; k < technique[i].stages[j].reroutedParameters.length; ++k)
                        {
                            technique[i].stages[j].reroutedParameters[k].Unbind();
                        }
                    }
                }
                Reflect.deleteProperty(this.techniques, t);
            }
        }
    }

    /**
     * Binds parameters
     * @returns {Boolean}
     */
    BindParameters()
    {
        this.UnBindParameters();
        if (!this.IsGood()) return false;

        for (let techniqueName in this.shader.techniques)
        {
            if (this.shader.techniques.hasOwnProperty(techniqueName))
            {
                let technique = this.shader.techniques[techniqueName];
                let passes = [];

                for (let i = 0; i < technique.passes.length; ++i)
                {
                    const pass = [];
                    pass.stages = [];
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

                        for (let k = 0; k < stageRes.constants.length; ++k)
                        {
                            const
                                constant = stageRes.constants[k],
                                { name, Type } = constant;

                            if (Tw2Effect.ConstantIgnore.includes(name)) continue;

                            if (name in this.parameters)
                            {
                                const param = this.parameters[name];
                                if (param.Bind(stage.constantBuffer, constant.offset, constant.size))
                                {
                                    stage.reroutedParameters.push(param);
                                }
                                else
                                {
                                    stage.parameters.push({
                                        parameter: param,
                                        constantBuffer: stage.constantBuffer,
                                        offset: constant.offset,
                                        size: constant.size
                                    });
                                }
                            }
                            else if (tw2.HasVariable(name))
                            {
                                stage.parameters.push({
                                    parameter: tw2.GetVariable(name),
                                    constantBuffer: stage.constantBuffer,
                                    offset: constant.offset,
                                    size: constant.size
                                });
                            }
                            else if (constant.isAutoregister && Type)
                            {
                                const variable = tw2.CreateVariable(name, undefined, Type);
                                if (variable)
                                {
                                    stage.parameters.push({
                                        parameter: variable,
                                        constantBuffer: stage.constantBuffer,
                                        offset: constant.offset,
                                        size: constant.size
                                    });
                                }
                            }
                            else if (this.autoParameter && constant.elements === 1)
                            {
                                let value = stage.constantBuffer.subarray(constant.offset, constant.offset + constant.size);
                                if (value.length === 0)
                                {
                                    value = undefined;
                                }
                                else if (value.length === 1)
                                {
                                    value = value[0];
                                }

                                const param = tw2.CreateVariable(name, value, Type);
                                if (param)
                                {
                                    this.parameters[name] = param;
                                    if (param.Bind(stage.constantBuffer, constant.offset, constant.size))
                                    {
                                        stage.reroutedParameters.push(param);
                                    }
                                    else
                                    {
                                        stage.parameter.push({
                                            parameter: param,
                                            constantBuffer: stage.constantBuffer,
                                            offset: constant.offset,
                                            size: constant.size
                                        });
                                    }
                                }
                            }

                            if (name in this.parameters && this.shader && name in this.shader.annotations)
                            {
                                this.parameters[name].annotation = this.shader.annotations[name];
                            }
                        }

                        for (let k = 0; k < stageRes.textures.length; ++k)
                        {
                            const name = stageRes.textures[k].name;
                            let param = null;
                            if (name in this.parameters)
                            {
                                param = this.parameters[name];
                            }
                            else if (tw2.HasVariable(name))
                            {
                                param = tw2.GetVariable(name);
                            }
                            else if (stageRes.textures[k].isAutoregister)
                            {
                                param = tw2.CreateVariable(name, undefined, Tw2TextureParameter);
                            }
                            else if (this.autoParameter)
                            {
                                param = this.parameters[name] = new Tw2TextureParameter(name);
                            }
                            else
                            {
                                continue;
                            }

                            const p = {
                                parameter: param,
                                slot: stageRes.textures[k].registerIndex,
                                sampler: null
                            };

                            for (let n = 0; n < stageRes.samplers.length; ++n)
                            {
                                if (stageRes.samplers[n].registerIndex === p.slot)
                                {
                                    if (stageRes.samplers[n].name in this.samplerOverrides)
                                    {
                                        p.sampler = this.samplerOverrides[stageRes.samplers[n].name].GetSampler(device, stageRes.samplers[n]);
                                    }
                                    else
                                    {
                                        p.sampler = stageRes.samplers[n];
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

        if (device["effectObserver"])
        {
            device["effectObserver"]["OnEffectChanged"](this);
        }

        this.autoParameter = false;
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

        this.shader.ApplyPass(technique, pass);

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
    }

    /**
     * GetPassCount
     * @param technique {String} - technique name
     * @returns {Number}
     */
    GetPassCount(technique)
    {
        if (this.shader === null || !(technique in this.techniques)) return 0;
        return this.techniques[technique].length;
    }

    /**
     * GetPassInput
     * @param technique {String} - technique name
     * @param {Number} pass
     * @returns {*}
     */
    GetPassInput(technique, pass)
    {
        if (this.shader === null || !(technique in this.techniques) || pass >= this.techniques[technique].length)
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
     */
    Render(cb)
    {
        const count = this.GetPassCount("Main");
        for (let i = 0; i < count; ++i)
        {
            this.ApplyPass("Main", i);
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
     * @returns {Boolean} true if updated
     */
    PopulateParameters()
    {
        this.autoParameter = true;
        return this.BindParameters();
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
     * Serializes a effect
     * @param {Tw2Effect} a
     * @param {Object} [out={}]
     * @returns {Object} out
     */
    static get(a, out = {})
    {
        assignIfExists(out, a, [ "name", "display", "effectFilePath" ]);
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
     * @param {*} [values={}]
     * @returns {*}
     */
    static getNormalizedOverrides(values={})
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
