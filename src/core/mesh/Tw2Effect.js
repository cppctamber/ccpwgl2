import { meta, util, device, resMan, store } from "global";
import { Tw2TextureParameter } from "../parameter/Tw2TextureParameter";
import { Tw2Vector4Parameter } from "../parameter/Tw2Vector4Parameter";
import { fromList } from "core/reader/Tw2BlackPropertyReaders";


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
        item.SetValue(new Float32Array([ r.ReadF32(), r.ReadF32(), r.ReadF32(), r.ReadF32() ]));
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


@meta.ctor("Tw2Effect")
@meta.stage(1)
export class Tw2Effect extends meta.Model
{

    @meta.string
    name = "";

    @meta.path
    effectFilePath = "";

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

    //resources
    //constParameters

    /**
     * Initializes the Tw2Effect
     */
    Initialize()
    {
        if (this.effectFilePath !== "")
        {
            this.effectFilePath = this.effectFilePath.toLowerCase();
            const path = Tw2Effect.ToEffectResPath(this.effectFilePath);
            this.effectRes = resMan.GetResource(path, res => this.OnResPrepared(res));
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
     * Fires on value changes
     * @param {*} opt
     */
    OnValueChanged(opt)
    {
        this.BindParameters();
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

        for (let param in this.parameters)
        {
            if (this.parameters.hasOwnProperty(param))
            {
                if ("GetResources" in this.parameters[param])
                {
                    this.parameters[param].GetResources(out);
                }
            }
        }

        return out;
    }

    /**
     * Rebuilds Cached Data
     * @param {Tw2EffectRes} res
     */
    OnResPrepared(res)
    {
        this.effectRes = res;
        this.shader = res.GetShader(this.options);
        this.BindParameters();
        this.EmitEvent("loaded", { effect: this, shader: this.shader, resource: res });
        return true;
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

        const { variables } = store;

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
                                name = constant.name,
                                Type = constant.Type;

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
                            else if (variables.Has(name))
                            {
                                stage.parameters.push({
                                    parameter: variables.Get(name),
                                    constantBuffer: stage.constantBuffer,
                                    offset: constant.offset,
                                    size: constant.size
                                });
                            }
                            else if (constant.isAutoregister && Type)
                            {
                                const variable = variables.Create(name, undefined, Type);
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

                                const param = variables.Create(name, value, Type);
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
                        }

                        for (let k = 0; k < stageRes.textures.length; ++k)
                        {
                            const name = stageRes.textures[k].name;
                            let param = null;
                            if (name in this.parameters)
                            {
                                param = this.parameters[name];
                            }
                            else if (variables.Has(name))
                            {
                                param = variables.Get(name);
                            }
                            else if (stageRes.textures[k].isAutoregister)
                            {
                                param = variables.Create(name, undefined, Tw2TextureParameter);
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
        if (cbh[0]) gl.uniform4fv(cbh[0], p.stages[0].constantBuffer);
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
     * Gets an object containing the textures currently set in the Tw2Effect
     * @param {{}} [out={}]
     * @returns {Object.<string, string>} out
     */
    GetTextures(out = {})
    {
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key) && this.parameters[key] instanceof Tw2TextureParameter)
            {
                let resourcePath = this.parameters[key].GetValue();
                if (resourcePath) out[key] = resourcePath;
            }
        }
        return out;
    }

    /**
     * Sets textures from an object
     * @param {{string:string}} options
     * @param {Boolean} [skipUpdate]
     * @returns {Boolean} true if updated
     */
    SetTextures(options = {}, skipUpdate)
    {
        let updated = false;
        for (let key in options)
        {
            if (options.hasOwnProperty(key) && options[key] !== undefined)
            {
                const
                    value = options[key],
                    param = this.parameters[key];

                if (Tw2TextureParameter.isValue(value))
                {
                    if (param)
                    {
                        if (!param.EqualsValue(value))
                        {
                            param.SetValue(value);
                            updated = true;
                        }
                    }
                    else
                    {
                        this.parameters[key] = new Tw2TextureParameter(key, value);
                        updated = true;
                    }
                }
            }
        }

        if (updated && !skipUpdate) this.UpdateValues();
        return updated;
    }

    /**
     * Gets an object containing all non texture parameters currently set in the Tw2Effect
     * - Matches sof parameter object
     * @param {{}} [out={}]
     * @returns {Object.<string, *>}
     */
    GetParameters(out = {})
    {
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key) && !(this.parameters[key] instanceof Tw2TextureParameter))
            {
                out[key] = this.parameters[key].GetValue();
            }
        }
        return out;
    }

    /**
     * Sets parameters from an object
     * @param {{string:*}} [options={}]
     * @param {Boolean} [skipUpdate]
     * @returns {Boolean} true if updated
     */
    SetParameters(options = {}, skipUpdate)
    {
        let updated = false;

        for (let key in options)
        {
            if (options.hasOwnProperty(key) && options[key] !== undefined)
            {
                const
                    value = options[key],
                    param = this.parameters[key];

                if (param)
                {
                    if (param.constructor.isValue(value) && !param.EqualsValue(value))
                    {
                        if (this.parameters[key].SetValue(value))
                        {
                            updated = true;
                        }
                    }
                }
                else
                {
                    const parameter = store.variables.Create(key, value);
                    if (parameter)
                    {
                        this.parameters[key] = parameter;
                        updated = true;
                    }
                }
            }
        }

        if (updated && !skipUpdate) this.UpdateValues();
        return updated;
    }

    /**
     * Sets texture overrides
     * @param {*} [options={}]
     * @param {Boolean} [skipUpdate]
     * @returns {Boolean} true if updated
     */
    SetOverrides(options = {}, skipUpdate)
    {
        let updated = false;

        for (let key in options)
        {
            if (options.hasOwnProperty(key) && options[key] !== undefined)
            {
                let param = this.parameters[key];

                // Allow creating of parameter from overrides incase method is
                // called before SetTextures.
                // Todo: Remove this once proper sampler overrides are implemented
                if (!param)
                {
                    param = this.parameters[key] = new Tw2TextureParameter(key);
                    updated = true;
                }

                if (param instanceof Tw2TextureParameter)
                {
                    let doUpdate = false;

                    const overrides = options[key];
                    for (let prop in overrides)
                    {
                        if (overrides.hasOwnProperty(prop) && Tw2TextureParameter.overrideProperties.includes(prop))
                        {
                            if (overrides[prop] !== param[prop])
                            {
                                doUpdate = true;
                                break;
                            }
                        }
                    }

                    if (doUpdate)
                    {
                        param.SetOverrides(options[key]);
                        updated = true;
                    }
                }
            }
        }

        if (updated && !skipUpdate) this.UpdateValues();
        return updated;
    }

    /**
     * Gets texture overrides
     * @param {{ string: {}}} [out={}]
     */
    GetOverrides(out = {})
    {
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key))
            {
                const param = this.parameters[key];
                if (param && param instanceof Tw2TextureParameter && param.useAllOverrides)
                {
                    out[key] = this.parameters[key].GetOverrides();
                }
            }
        }
        return out;
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
     * @param {Boolean} [ignoreEmpty]
     * @returns {*}
     */
    PerChild(func, ignoreEmpty)
    {
        const rv = super.PerChild(func, ignoreEmpty);
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
     * on Event Listener
     * @param {Tw2Effect} source
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @returns {boolean}
     */
    static onListener(source, eventName, listener, context)
    {
        if (eventName === "loaded" && source.shader)
        {
            listener.call(context, { effect: source, shader: source.shader, resource: source.effectRes });
            return true;
        }
        return false;
    }

    /**
     * Converts an effect file path into one suitable for an effect resource
     * @param {String} path
     * @returns {String}
     */
    static ToEffectResPath(path)
    {
        path = path ? path.substr(0, path.lastIndexOf(".")).replace("/effect/", device.effectDir) + ".sm_" + device.shaderModel : "";
        return path.toLowerCase();
    }

    /**
     * Converts an effect resource path back into a normal effect file path
     * @param {String} path
     * @param {String} [ext='fx']
     * @returns {String}
     */
    static FromEffectResPath(path, ext = "fx")
    {
        path = path.substr(0, path.lastIndexOf(".")).replace(device.effectDir, "/effect/") + "." + ext;
        return path.toLowerCase();
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

        let updated = util.assignIfExists(a, values, [ "name", "display", "autoParameter" ]);

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

            // Clear current effect
            a.UnBindParameters();
            a.shader = null;

            if (a.effectRes)
            {
                a.effectRes.UnregisterNotification(this);
                a.effectRes = null;
            }

            // New effect
            if (a.effectFilePath !== "")
            {
                a.UpdateValues(opt);
                const path = Tw2Effect.ToEffectResPath(a.effectFilePath);
                resMan.GetResource(path, res => a.OnResPrepared(res));
                return true;
            }

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
        util.assignIfExists(out, a, [ "name", "display", "effectFilePath" ]);
        out.parameters = a.GetParameters();
        out.textures = a.GetTextures();
        out.overrides = a.GetOverrides();
        out.options = Object.assign(a.options);
        return out;
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
