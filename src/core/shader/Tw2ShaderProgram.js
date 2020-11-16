import { meta } from "utils";
import { device } from "global";
import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { ErrShaderLink } from "./Tw2Shader";


@meta.type("Tw2ShaderProgram")
export class Tw2ShaderProgram
{

    @meta.list(WebGLUniformLocation)
    constantBufferHandles = [];

    @meta.struct("Tw2VertexDeclaration")
    input = new Tw2VertexDeclaration();

    @meta.list(WebGLUniformLocation)
    samplerHandles = [];

    @meta.struct(WebGLUniformLocation)
    shadowStateFloat = null;

    @meta.struct(WebGLUniformLocation)
    shadowStateInt = null;

    @meta.struct(WebGLUniformLocation)
    shadowStateYFlip = null;

    @meta.array
    volumeSlices = [];


    /**
     * Creates a shader program
     * @param {String} vertexShader
     * @param {String} fragmentShader
     * @param {Tw2ShaderPass} pass
     * @param {Tw2EffectRes} res
     * @param {Boolean} [skipError]
     */
    static create(vertexShader, fragmentShader, pass, res, skipError)
    {
        const
            { gl } = device,
            program = new Tw2ShaderProgram();

        // Create and link program
        program.program = gl.createProgram();
        gl.attachShader(program.program, vertexShader);
        gl.attachShader(program.program, fragmentShader);
        gl.linkProgram(program.program);

        // Ensure shader is good
        if (!gl.getProgramParameter(program.program, gl.LINK_STATUS))
        {
            if (!skipError)
            {
                throw new ErrShaderLink({
                    path: res.path,
                    infoLog: gl.getProgramInfoLog(program.program)
                });
            }
            return null;
        }

        gl.useProgram(program.program);

        // Per object data
        for (let j = 0; j < 16; ++j)
        {
            program.constantBufferHandles[j] = gl.getUniformLocation(program.program, "cb" + j);
        }

        // Samplers
        for (let j = 0; j < 16; ++j)
        {
            program.samplerHandles[j] = gl.getUniformLocation(program.program, "s" + j);
            gl.uniform1i(program.samplerHandles[j], j);
        }

        //
        for (let j = 0; j < 16; ++j)
        {
            program.samplerHandles[j + 12] = gl.getUniformLocation(program.program, "vs" + j);
            gl.uniform1i(program.samplerHandles[j + 12], j + 12);
        }

        // Collect vertex declarations
        const { elements } = pass.stages[0].inputDefinition;
        for (let j = 0; j < elements.length; ++j)
        {
            const attr = "attr" + j;
            let location = gl.getAttribLocation(program.program, attr);
            if (location >= 0)
            {
                const el = Tw2VertexElement.from({
                    usage: elements[j].usage,
                    usageIndex: elements[j].usageIndex,
                    location,
                    attr
                });
                program.input.elements.push(el);
            }
        }
        program.input.RebuildHash();

        // Shadow states
        program.shadowStateInt = gl.getUniformLocation(program.program, "ssi");
        program.shadowStateFloat = gl.getUniformLocation(program.program, "ssf");
        program.shadowStateYFlip = gl.getUniformLocation(program.program, "ssyf");
        gl.uniform3f(program.shadowStateYFlip, 0, 0, 1);

        //Get volume slices
        const { samplers } = pass.stages[1];
        for (let j = 0; j < samplers.length; ++j)
        {
            if (samplers[j].isVolume)
            {
                program.volumeSlices[samplers[j].registerIndex] = gl.getUniformLocation(program.program, "s" + samplers[j].registerIndex + "sl");
            }
        }

        return program;
    }
}
