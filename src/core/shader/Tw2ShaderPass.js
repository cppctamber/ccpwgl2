import { isArray, meta } from "utils";
import { device } from "global";
import { Tw2ShaderStage } from "./Tw2ShaderStage";
import { Tw2ShaderState } from "./Tw2ShaderState";
import { Tw2ShaderProgram } from "./Tw2ShaderProgram";


@meta.type("Tw2ShaderPass")
@meta.wgl.define("Tw2ShaderPass")
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
     * TEMPORARY. Applies the render states a pass declares. See {@link Apply}.
     * Aliased as `Tw2Shader.ENABLE_CARBON_RENDER_STATES`.
     * @type {Boolean}
     */
    static ENABLE_CARBON_RENDER_STATES = false;

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

        // TEMPORARY, 2026-08-18. Exposed as `Tw2Shader.ENABLE_CARBON_RENDER_STATES`.
        //
        // Gates the states a CARBON (dx11) container declares - `isCarbon` is
        // set only by Tw2CarbonEffectReader, so gles2 containers and the manual
        // definitions in toDeprecate keep applying theirs either way.
        //
        // Honouring these states is correct and is what Carbon does, but the
        // dx11 containers carry states our frame cannot honour yet:
        // `flarequad`/`flarequadsoft` High declare `RS_ZENABLE 0` and expect to
        // occlude themselves from a `DepthMap` nothing publishes. Until this
        // session ccpwgl dropped container states entirely, so that bargain was
        // covered by accident.
        //
        // Turning this off restores exactly that older behaviour for dx11: the
        // pass inherits the render mode's standard states. A switch for
        // bisecting and for shipping, not a decision - delete it once the
        // container states can all be honoured.
        if (!this.isCarbon || Tw2ShaderPass.ENABLE_CARBON_RENDER_STATES)
        {
            for (let i = 0; i < this.states.length; i++)
            {
                device.SetRenderState(this.states[i].state, this.states[i].value);
            }
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

        if (isNaN(state))
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
     * Checks whether this pass's linked program declares a given constant
     * buffer register.
     *
     * Read from the LINKED program rather than the declaration, because that is
     * what decides whether an upload lands: Tw2ShaderProgram records the linked
     * array size for every `cbN` uniform it finds, and a register the program
     * never references is absent from that map even if the source declared it.
     *
     * Answers false until the program links, so a caller that needs a settled
     * answer has to wait for the effect to be good.
     * @param {Number} register
     * @returns {Boolean}
     */
    UsesConstantBuffer(register)
    {
        const program = this.shaderProgram;

        if (!program) return false;

        return !!(program.constantBufferSizes?.[register] || program.constantBufferHandles?.[register]);
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
        pass.SetStates(json.states);
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
