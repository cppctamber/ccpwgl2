import { meta } from "utils";
import { device } from "global";
import { Tw2Shader } from "./Tw2Shader";
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
     * Applies a shader pass
     */
    Apply()
    {
        const { gl } = device;

        for (let i = 0; i < this.states.length; i++)
        {
            device.SetRenderState(this.states[i].state, this.states[i].value);
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
     * Reads ccp shader binary pass
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  res
     * @returns {Tw2ShaderPass}
     */
    static fromCCPBinary(reader, res)
    {
        const
            pass = new Tw2ShaderPass(),
            stageCount = reader.ReadUInt8();

        // Reset to true  for each pass
        res.validShadowShader = true;

        // Stages
        for (let i = 0; i < stageCount; i++)
        {
            pass.stages.push(Tw2ShaderStage.fromCCPBinary(reader, res));
            if (res.version >= 3) reader.ReadUInt8();
            if (res.version > 7) reader.ReadUInt8();
        }

        // States
        const stateCount = reader.ReadUInt8();
        for (let i = 0; i < stateCount; i++)
        {
            pass.states.push(Tw2ShaderState.fromCCPBinary(reader));
        }

        // link shaders
        pass.shaderProgram = Tw2ShaderProgram.create(
            pass.stages[0].shader,
            pass.stages[1].shader,
            pass,
            res.path
        );

        // Link shadow shader
        if (res.validShadowShader)
        {
            pass.shadowShaderProgram = Tw2ShaderProgram.create(
                pass.stages[0].shadowShader,
                pass.stages[1].shadowShader,
                pass,
                res.path,
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
