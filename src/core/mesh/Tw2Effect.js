import {util, resMan, device, store, Tw2BaseClass} from "../../global";
import {Tw2TextureParameter, Tw2Vector4Parameter} from "../parameter";
import {ErrFeatureNotImplemented} from "../Tw2Error";


/**
 * Tw2Effect
 *
 * @property {String} name
 * @property {Boolean} autoParameter
 * @property {String} effectFilePath
 * @property {Tw2EffectRes} effectRes
 * @property {Object.<string, string>} options
 * @property {Object.<string, Tw2Parameter>} parameters
 * @property {Object.<string, Tw2TextureParameter>} resources
 * @property {Object.<string, Tw2SamplerOverride>} samplerOverrides
 * @property {Tw2Shader|null} shader
 * @property {Object.<string, Array>} techniques
 */
export class Tw2Effect extends Tw2BaseClass
{

    name = "";
    //constParameters = {};
    effectFilePath = "";
    options = {};
    parameters = {};
    //resources = {};
    samplerOverrides = {};
    techniques = {};

    // ccpwgl
    autoParameter = false;
    effectRes = null;
    shader = null;

    /**
     * Temporary until we know what const parameters are supposed to do
     * @returns {*}
     */
    get constParameters()
    {
        const out = {};
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key) && this.parameters[key]._isConstant)
            {
                out[key] = this.parameters[key];
            }
        }
        return out;
    }

    /**
     * Initializes the Tw2Effect
     */
    Initialize()
    {
        if (this.effectFilePath !== "")
        {
            this.effectFilePath = this.effectFilePath.toLowerCase();
            const path = Tw2Effect.ToEffectResPath(this.effectFilePath);
            this.effectRes = resMan.GetResource(path);
            this.effectRes.RegisterNotification(this);
        }
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
        for (let i = 0; i < res.length; i++)
        {
            res[i].KeepAlive();
        }
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
        this.shader = res.GetShader(this.options);
        this.BindParameters();
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

        if (!this.IsGood())
        {
            return false;
        }

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
                            else if (store.variables.Has(name))
                            {
                                stage.parameters.push({
                                    parameter: store.variables.Get(name),
                                    constantBuffer: stage.constantBuffer,
                                    offset: constant.offset,
                                    size: constant.size
                                });
                            }
                            else if (constant.isAutoregister && Type)
                            {
                                const variable = store.variables.Create(name, undefined, Type);
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

                                const param = store.variables.Create(name, value, Type);
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
                            else if (store.variables.Has(name))
                            {
                                param = store.variables.Get(name);
                            }
                            else if (stageRes.textures[k].isAutoregister)
                            {
                                param = store.variables.Create(name, undefined, Tw2TextureParameter);
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

        if (this.autoParameter)
        {
            this.AutoUnPopulate();
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
        if (this.shader === null || !(technique in this.techniques))
        {
            return 0;
        }
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
        for (const key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key))
            {
                if (this.parameters[key] instanceof Tw2TextureParameter)
                {
                    const resourcePath = this.parameters[key].GetValue();
                    if (resourcePath)
                    {
                        out[key] = resourcePath;
                    }
                }
            }
        }
        return out;
    }

    /**
     * Sets textures from an object
     * @param {{string:string}} options
     * @returns {Boolean} true if updated
     */
    SetTextures(options = {})
    {
        let updated = false;
        for (const key in options)
        {
            if (options.hasOwnProperty(key) && options[key] !== undefined)
            {
                const
                    value = options[key],
                    param = this.parameters[key];

                if (param instanceof Tw2TextureParameter)
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
        for (const key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key))
            {
                if (this.parameters[key] instanceof Tw2TextureParameter)
                {
                    continue;
                }

                out[key] = this.parameters[key].GetValue(true);
            }
        }
        return out;
    }

    /**
     * Sets parameters from an object
     * @param {{string:*}} [options={}]
     * @returns {Boolean} true if updated
     */
    SetParameters(options = {})
    {
        let updated = false;
        for (const key in options)
        {
            if (options.hasOwnProperty(key) && options[key] !== undefined)
            {
                const
                    value = options[key],
                    param = this.parameters[key];

                if (Tw2TextureParameter.isValue(value))
                {
                    console.log("Use 'Tw2Effect.SetTextures' when setting texture values");
                }

                if (param)
                {
                    if (param.constructor.isValue(value) && !param.EqualsValue(value))
                    {
                        this.parameters[key].SetValue(value);
                        updated = true;
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

        return updated;
    }

    /**
     * Sets texture overrides
     * @param {*} [options={}]
     * @returns {Boolean} true if updated
     */
    SetTextureOverrides(options = {})
    {
        let updated = false;
        for (const key in options)
        {
            if (options.hasOwnProperty(key) && options[key] !== undefined)
            {
                const param = this.parameters[key];
                if (param && param instanceof Tw2TextureParameter)
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
        return updated;
    }

    /**
     * Gets texture overrides
     * @param {{ string: {}}} [out={}]
     */
    GetTextureOverrides(out = {})
    {
        for (const key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key))
            {
                if (this.parameters[key] instanceof Tw2TextureParameter)
                {
                    const param = this.parameters[key];
                    if (param && param.useAllOverrides)
                    {
                        out[key] = this.parameters[key].GetOverrides();
                    }
                }
            }
        }
        return out;
    }

    /**
     * Adds and missing effect parameters and/or resources
     * @returns {Boolean} true if updated
     */
    AutoPopulate()
    {
        this.autoParameter = true;
        return this.BindParameters();
    }

    /**
     * Removes unsupported effect parameters, resources and samplers
     * @returns {boolean}
     */
    AutoUnPopulate()
    {
        const remove = (target, method) =>
        {
            for (const key in target)
            {
                if (target.hasOwnProperty(key))
                {
                    if (!this.shader || !this.shader[method](key))
                    {
                        target[key].Destroy();
                        Reflect.deleteProperty(target, key);
                        removed = true;
                    }
                }
            }
        };

        let removed = false;
        // if(remove(this.constParameters, "HasConstant")) removed = true;
        if (remove(this.parameters, "HasConstant")) removed = true;
        if (remove(this.parameters, "HasTexture")) removed = true;
        if (remove(this.samplerOverrides, "HasSampler")) removed = true;
        return removed;
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
     * Creates a Tw2Effect from an object
     * @param {{}|Tw2Effect} [values]
     * @param {String} [values.name='']
     * @param {String} [values.effectFilePath='']
     * @param {Boolean} [values.autoParameter]
     * @param {{string: *}} [values.parameters]
     * @param {{string: string}} [values.textures]
     * @param {{string: {}}} [values.overrides]
     * @param {*} [options]
     * @returns {Tw2Effect}
     */
    static from(values, options)
    {
        // Allow already constructed effect to be passed
        if (values && values instanceof Tw2Effect)
        {
            return values;
        }

        const effect = new this();

        if (values)
        {
            util.assignIfExists(effect, values, ["name", "effectFilePath", "display", "autoParameter",]);

            if ("parameters" in values) effect.SetParameters(values.parameters);
            if ("textures" in values) effect.SetTextures(values.textures);
            if ("overrides" in values) effect.SetTextureOverrides(values.overrides);
            //if ("samplerOverrides" in values) effect.SetSamplerOverrides(values.overrides);

            if (effect.name === "" && values.effectFilePath !== "")
            {
                let path = values.effectFilePath;
                effect.name = path.substring(path.lastIndexOf("/") + 1, path.length);
            }

            if (!effect.name && effect.effectFilePath)
            {
                effect.name = effect.effectFilePath.substring(
                    effect.effectFilePath.lastIndexOf("/") + 1,
                    effect.effectFilePath.lastIndexOf(".")
                );
            }
        }

        if (!options || !options.skipUpdate)
        {
            effect.Initialize();
        }

        return effect;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["effectFilePath", r.path],
            ["name", r.string],
            ["parameters", r.fromArray("name", "parameters")],
            ["resources", r.fromArray("name", "parameters")],
            ["constParameters", r.fromArray("name", "parameters", r =>
            {
                const item = new Tw2Vector4Parameter();
                item.name = r.ReadStringU16();
                item._isConstant = true;
                r.ExpectU16(0, "unknown content");
                r.ExpectU16(0, "unknown content");
                r.ExpectU16(0, "unknown content");
                item.SetValue(new Float32Array([r.ReadF32(), r.ReadF32(), r.ReadF32(), r.ReadF32()]));
                return item;
            })],
            ["options", (reader) =>
            {
                throw ErrFeatureNotImplemented({feature: "Tw2Effect options"});
            }],
            ["samplerOverrides", (reader) =>
            {
                throw ErrFeatureNotImplemented({feature: "Tw2Effect samplerOverrides"});
            }]
        ];
    }
}
