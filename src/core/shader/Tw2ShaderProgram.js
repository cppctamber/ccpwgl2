import { meta } from "utils";
import { device } from "global";
import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { ErrShaderLink } from "./Tw2Shader";


@meta.type("Tw2ShaderProgram")
@meta.wgl.define("Tw2ShaderProgram")
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
     * @param {Tw2EffectRes} context
     * @param {Boolean} [skipError]
     */
    static create(vertexShader, fragmentShader, pass, context, skipError)
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
                    path: context.path,
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

        // Volume samplers?
        for (let j = 0; j < 16; ++j)
        {
            program.samplerHandles[j + 12] = gl.getUniformLocation(program.program, "vs" + j);
            gl.uniform1i(program.samplerHandles[j + 12], j + 12);
        }

        // Collect used vertex declarations
        // CEWG passes bind attributes by their emitted semantic names
        // (in_POSITION0 etc.); the legacy positional attrN lookup is untouched.
        const { elements } = pass.stages[0].inputDefinition;
        for (let j = 0; j < elements.length; ++j)
        {
            const attr = pass.isCewg && elements[j]._attr ? elements[j]._attr : "attr" + j;
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

                // Write back location
                elements[j]._attr = attr;
                elements[j]._registerIndex = j;
                elements[j].location = location;
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
            samplers[j]._attr = `s${samplers[j].registerIndex}`;

            if (samplers[j].isVolume)
            {
                program.volumeSlices[samplers[j].registerIndex] = gl.getUniformLocation(program.program, "s" + samplers[j].registerIndex + "sl");
            }
        }

        if (pass.isCewg)
        {
            Tw2ShaderProgram.SetupCewgResources(program, pass, gl);
            Tw2ShaderProgram.SetupCewgSamplerUnits(program, pass, gl);
        }

        return program;
    }

    /**
     * Remaps CEWG sampler registers >= MAX_TEXTURE_IMAGE_UNITS (16) onto free
     * low texture units. The legacy model binds sampler register N to texture
     * unit N, but DX11/Carbon can assign sampler registers past the WebGL2
     * 16-unit limit - e.g. `Detail3Map` at `s16` once the tiled-light samplers
     * at s11-s13 are stubbed out. Such a register has no valid unit and its
     * `uniform1i` is never set (the s0-s15 setup loop above does not reach it),
     * so it defaults to unit 0 and collides with whatever samples unit 0
     * (GL_INVALID_OPERATION: two textures of different types share a sampler
     * location). Assign each out-of-range register the lowest unit in [0,16)
     * not already taken by an in-range sampler or an in-range volume slice, set
     * its `uniform1i`, and record the mapping on `program.cewgSamplerUnits` so
     * Tw2Effect binds the texture to the same unit at draw time. In-range
     * registers keep unit == register (no map entry), so shaders without an
     * out-of-range sampler are unaffected.
     * @param {Tw2ShaderProgram} program
     * @param {Tw2ShaderPass} pass
     * @param {WebGL2RenderingContext} gl
     */
    static SetupCewgSamplerUnits(program, pass, gl)
    {
        const MAX_UNITS = 16;
        const remap = new Map();    // sampler registerIndex -> texture unit
        const occupied = new Set(); // units already claimed in [0, MAX_UNITS)

        // In-range regular samplers keep unit == registerIndex; volume samplers
        // occupy registerIndex + 12 (see the vs# loop in SetupGLSLShader).
        for (let s = 0; s < pass.stages.length; ++s)
        {
            for (const texture of pass.stages[s].textures || [])
            {
                if (texture.registerIndex < MAX_UNITS) occupied.add(texture.registerIndex);
            }
            for (const sampler of pass.stages[s].samplers || [])
            {
                if (sampler.isVolume && sampler.registerIndex + 12 < MAX_UNITS)
                {
                    occupied.add(sampler.registerIndex + 12);
                }
            }
        }

        for (let s = 0; s < pass.stages.length; ++s)
        {
            for (const texture of pass.stages[s].textures || [])
            {
                const reg = texture.registerIndex;
                if (reg < MAX_UNITS || remap.has(reg)) continue;

                let unit = 0;
                while (unit < MAX_UNITS && occupied.has(unit)) unit++;
                if (unit >= MAX_UNITS) continue; // over the unit budget; nothing free

                occupied.add(unit);
                remap.set(reg, unit);
                const location = gl.getUniformLocation(program.program, "s" + reg);
                if (location) gl.uniform1i(location, unit);
            }
        }

        program.cewgSamplerUnits = remap.size ? remap : null;
    }

    /**
     * Resolves a CEWG pass's non-sampler bindings against the linked
     * program: structured UBOs (bones) get uniform-block binding points,
     * structured/buffer data textures (sb#/bt#) get texture units above
     * the legacy s0-15/vs0-15 range. The results are consumed at draw
     * time by CewgResourceBinder.ApplyPass.
     * @param {Tw2ShaderProgram} program
     * @param {Tw2ShaderPass} pass
     * @param {WebGL2RenderingContext} gl
     */
    static SetupCewgResources(program, pass, gl)
    {
        program.cewgUniformBlocks = [];
        program.cewgDataTextures = [];

        const seen = new Set();
        let bindingPoint = 0;
        let unit = 28; // keep in sync with CewgResourceBinder.FIRST_DATA_TEXTURE_UNIT

        for (let s = 0; s < pass.stages.length; ++s)
        {
            const bindings = pass.stages[s].cewgBindings;
            if (!bindings) continue;

            for (let i = 0; i < bindings.length; ++i)
            {
                const binding = bindings[i];
                const key = `${binding.kind}:${binding.name}`;
                if (seen.has(key)) continue;

                if (binding.kind === "structuredUbo")
                {
                    const blockIndex = gl.getUniformBlockIndex(program.program, binding.name + "Block");
                    if (blockIndex === gl.INVALID_INDEX) continue;
                    seen.add(key);
                    gl.uniformBlockBinding(program.program, blockIndex, bindingPoint);
                    program.cewgUniformBlocks.push({
                        name: binding.name,
                        bindingPoint,
                        capacityElements: binding.capacityElements || 0,
                        strideBytes: binding.strideBytes || 0,
                        byteLength: (binding.capacityElements || 0) * (binding.strideBytes || 0)
                    });
                    bindingPoint++;
                }
                else if (binding.kind === "structuredTexture" || binding.kind === "bufferTexture")
                {
                    const location = gl.getUniformLocation(program.program, binding.name);
                    if (!location) continue;
                    seen.add(key);
                    gl.uniform1i(location, unit);
                    program.cewgDataTextures.push({
                        name: binding.name,
                        kind: binding.kind,
                        unit,
                        registerIndex: binding.registerIndex,
                        strideBytes: binding.strideBytes || 0,
                        width: binding.width || 0
                    });
                    unit++;
                }
            }
        }
    }
}
