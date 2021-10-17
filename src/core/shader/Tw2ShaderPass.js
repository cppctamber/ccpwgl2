import { isArray, meta } from "utils";
import { device } from "global";
import { Tw2ShaderStage } from "./Tw2ShaderStage";
import { Tw2ShaderState } from "./Tw2ShaderState";
import { Tw2ShaderProgram } from "./Tw2ShaderProgram";


@meta.type("Tw2ShaderPass")
export class Tw2ShaderPass
{

    @meta.struct("Tw2ShaderProgram")
    shaderProgram = null;

    @meta.struct("Tw2ShaderProgram")
    shadowShaderProgram = null;

    @meta.list("Tw2ShaderStage")
    stages = [];

    @meta.list("Tw2ShaderState")
    states = [];

    /**
     * Gets the fragment shader
     * @return {Tw2ShaderStage}
     */
    get vertex()
    {
        return this.stages[0];
    }

    /**
     * alias for vertex
     * @return {Tw2ShaderStage}
     */
    get vs()
    {
        return this.stages[0];
    }

    /**
     * Gets the fragment shader
     * @return {Tw2ShaderStage}
     */
    get fragment()
    {
        return this.stages[1];
    }

    /**
     * Alias for fragment
     * @return {Tw2ShaderStage}
     */
    get ps()
    {
        return this.stages[1];
    }

    /**
     * Applies a shader pass
     * @param {Array<{ state: Number, value: Number|Boolean }>} [stateOverride]
     */
    Apply(stateOverride)
    {
        const { gl } = device;

        for (let i = 0; i < this.states.length; i++)
        {
            device.SetRenderState(this.states[i].state, this.states[i].value);
        }

        if (stateOverride)
        {
            if (isArray(stateOverride))
            {
                for (let i = 0; i < stateOverride.length; i++)
                {
                    device.SetRenderState(stateOverride[i].state, stateOverride[i].value);
                }
            }
            else
            {
                for (const key in stateOverride)
                {
                    if (stateOverride.hasOwnProperty(key))
                    {
                        device.SetRenderState(key, stateOverride[key]);
                    }
                }
            }
        }

        if (device.IsAlphaTestEnabled())
        {
            gl.useProgram(this.shadowShaderProgram.program);
            device.SetShadowHandles(this.shadowShaderProgram);
        }
        else
        {
            gl.useProgram(this.shaderProgram.program);
            device.SetShadowHandles(null);
        }
    }

    /**
     * Sets a shader state
     * @param {String|Number} state  - Render state enum (string allowed in-case iterating an object)
     * @param {Number|Boolean} value
     */
    SetState(state, value)
    {
        state = Number(state);

        if (!isNaN(state))
        {
            throw new Error("Invalid render state: " + state);
        }

        const found = this.states.find(x => x.state === state);
        if (found)
        {
            found.value = value;
        }
        else
        {
            this.states.push(Tw2ShaderState.fromJSON({ state, value }));
            this.states.sort((a, b) => a.state - b.state);
        }
    }

    /**
     * Sets states from an array or object
     * @param {Array|Object} obj
     */
    SetStates(obj)
    {
        if (!obj) return;

        if (isArray(obj))
        {
            for (let i = 0; i < obj.length; i++)
            {
                this.SetState(obj[i].state, obj[i].value);
            }
            return;
        }

        for (const key in obj)
        {
            if (obj.hasOwnProperty(key))
            {
                this.SetState(key, obj[key]);
            }
        }
    }

    /**
     * Gets pass parameters
     * @param {Object} [out={}]
     * @param {Object} [mask]
     * @return {{}} out
     */
    GetParameterNames(out = {}, mask)
    {
        if (mask && mask.stage)
        {
            return this.stages[mask.stage] ? this.stages[mask.stage].GetParameterNames(out, mask) : out;
        }

        for (let i = 0; i < this.stages.length; i++)
        {
            this.stages[i].GetParameterNames(out);
        }

        return out;
    }

    /**
     * Checks if a constant definition exist
     * @param {String} name
     * @return {boolean}
     */
    HasConstant(name)
    {
        for (let i = 0; i < this.stages.length; i++)
        {
            if (this.stages[i].HasConstant(name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a texture definition exist
     * @param {String} name
     * @return {boolean}
     */
    HasTexture(name)
    {
        for (let i = 0; i < this.stages.length; i++)
        {
            if (this.stages[i].HasTexture(name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a sampler state exists
     * @param {String} name
     * @return {boolean}
     */
    HasSampler(name)
    {
        for (let i = 0; i < this.stages.length; i++)
        {
            if (this.stages[i].HasSampler(name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * TODO: Replace with utility functions
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @return {Tw2ShaderPass}
     */
    static fromJSON(json, context)
    {
        // Always false for now
        context.validShadowShader = false;
        const pass = new Tw2ShaderPass();
        pass.stages[0] = Tw2ShaderStage.fromJSON(json.vertex || json.vs, context, Tw2ShaderStage.Type.VERTEX);
        pass.stages[1] = Tw2ShaderStage.fromJSON(json.fragment || json.ps, context, Tw2ShaderStage.Type.FRAGMENT);
        pass.SetStates(json.stages);
        return this.createPrograms(pass, context);
    }

    /**
     * Reads ccp shader binary pass
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  context
     * @returns {Tw2ShaderPass}
     */
    static fromCCPBinary(reader, context)
    {
        const
            pass = new Tw2ShaderPass(),
            stageCount = reader.ReadUInt8();

        // Reset to true  for each pass
        context.validShadowShader = true;

        // Stages
        for (let i = 0; i < stageCount; i++)
        {
            pass.stages.push(Tw2ShaderStage.fromCCPBinary(reader, context));
            if (context.version >= 3) reader.ReadUInt8();
            if (context.version > 7) reader.ReadUInt8();
        }

        // States
        const stateCount = reader.ReadUInt8();
        for (let i = 0; i < stateCount; i++)
        {
            pass.states.push(Tw2ShaderState.fromCCPBinary(reader));
        }
        pass.states.sort((a, b) => a.state - b.state);

        return this.createPrograms(pass, context);
    }

    /**
     * Creates the shader programs
     * @param {Tw2ShaderPass} pass
     * @param {Tw2EffectRes} context
     */
    static createPrograms(pass, context)
    {
        // link shaders
        pass.shaderProgram = Tw2ShaderProgram.create(
            pass.stages[0].shader,
            pass.stages[1].shader,
            pass,
            context
        );

        // Link shadow shader
        if (context.validShadowShader)
        {
            pass.shadowShaderProgram = Tw2ShaderProgram.create(
                pass.stages[0].shadowShader,
                pass.stages[1].shadowShader,
                pass,
                context,
                true
            );

            if (pass.shadowShaderProgram === null)
            {
                pass.shadowShaderProgram = pass.shaderProgram;
            }
        }
        else
        {
            pass.shadowShaderProgram = pass.shaderProgram;
        }

        return pass;
    }


}
