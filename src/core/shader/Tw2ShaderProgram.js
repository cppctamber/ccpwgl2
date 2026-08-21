import { meta } from "utils";
import { device } from "global";
import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { ErrShaderLink } from "./Tw2Shader";


/**
 * How many `s#` sampler uniforms `SetupGLSLShader` actually assigns.
 *
 * WebGL2 guarantees 16 texture image units per stage and the setup loop is
 * written to that guarantee. It is deliberately NOT the driver limit: a driver
 * reporting more does not make the loop assign more, so this is the register
 * above which a sampler needs remapping.
 * @type {Number}
 */
const SAMPLER_SETUP_UNITS = 16;

/**
 * Highest constant-buffer register Carbon itself uses.
 *
 * Measured across all 537 shipped dx11 effects on 2026-08-11: declared registers
 * are 0-4, 6 and 7 only. Anything above this is an emitter-owned buffer.
 */
const CARBON_LAST_CB_REGISTER = 7;


@meta.type("Tw2ShaderProgram")
@meta.wgl.define("Tw2ShaderProgram")
export class Tw2ShaderProgram
{

    @meta.list(WebGLUniformLocation)
    constantBufferHandles = [];

    @meta.list(Number)
    constantBufferSizes = [];

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

    @meta.list(WebGLUniformLocation)
    intConstantHandles = [];


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
                const infoLog = gl.getProgramInfoLog(program.program);

                // The driver's reason is the only useful part and it is buried
                // in the error's data, so surface it directly - link limits are
                // driver-specific and do not reproduce under SwiftShader.
                console.error(
                    "Shader link failed:", context.path,
                    "\n  driver log:", infoLog,
                    "\n  vertex log:", gl.getShaderInfoLog(vertexShader),
                    "\n  fragment log:", gl.getShaderInfoLog(fragmentShader)
                );

                throw new ErrShaderLink({ path: context.path, infoLog });
            }
            return null;
        }

        gl.useProgram(program.program);

        // Per object data
        for (let j = 0; j < 16; ++j)
        {
            program.constantBufferHandles[j] = gl.getUniformLocation(program.program, "cb" + j);
        }

        // Carbon emitters declare compact cb arrays from the highest register
        // actually used. Keep their linked sizes so uploads can be clipped to
        // the declaration instead of submitting a larger ABI backing array.
        const uniformCount = gl.getProgramParameter(program.program, gl.ACTIVE_UNIFORMS);
        for (let j = 0; j < uniformCount; j++)
        {
            const uniform = gl.getActiveUniform(program.program, j);
            const match = uniform?.name?.match(/^cb(\d+)(?:\[0\])?$/);
            if (match) program.constantBufferSizes[Number(match[1])] = uniform.size;
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
        // Carbon passes bind attributes by their emitted semantic names
        // (in_POSITION0 etc.); the legacy positional attrN lookup is untouched.
        const { elements } = pass.stages[0].inputDefinition;
        for (let j = 0; j < elements.length; ++j)
        {
            const attr = pass.isCarbon && elements[j]._attr ? elements[j]._attr : "attr" + j;
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

        const psConstants = pass.stages[1] && pass.stages[1].constants || [];
        for (let j = 0; j < psConstants.length; ++j)
        {
            const constant = psConstants[j];
            if (constant.name !== "PerObjectPSInt") continue;

            const
                firstRegister = constant.offset / 4,
                registerCount = Math.ceil(constant.size / 4);

            for (let k = 0; k < registerCount; ++k)
            {
                const register = firstRegister + k;
                program.intConstantHandles[register] = gl.getUniformLocation(program.program, "i" + register);
            }
        }

        //Get volume slices
        const { samplers } = pass.stages[1];
        for (let j = 0; j < samplers.length; ++j)
        {
            const textureRegister = samplers[j]._textureRegisterIndex ?? samplers[j].registerIndex;
            samplers[j]._attr = `s${textureRegister}`;

            if (samplers[j].isVolume)
            {
                program.volumeSlices[samplers[j].registerIndex] = gl.getUniformLocation(program.program, "s" + textureRegister + "sl");
            }
        }

        if (pass.isCarbon)
        {
            // Sampler uniforms the emitter declared under their own symbol
            // (the merged detail array's sDetailArrayMap) are invisible to the
            // positional s#/vs# loops above, so their unit would stay at the
            // default 0 and collide with whatever samples unit 0. Point them
            // at their register's unit, matching the bind in Tw2Effect.
            for (let j = 0; j < pass.stages.length; ++j)
            {
                for (const texture of pass.stages[j].textures || [])
                {
                    if (!texture._glslSymbol) continue;
                    const location = gl.getUniformLocation(program.program, texture._glslSymbol);
                    const unit = j === 0 ? texture.registerIndex + 12 : texture.registerIndex;
                    if (location) gl.uniform1i(location, unit);
                }
            }

            Tw2ShaderProgram.SetupCarbonResources(program, pass, gl);
            Tw2ShaderProgram.SetupCarbonSamplerUnits(program, pass, gl);
        }

        return program;
    }

    /**
     * Remaps Carbon sampler registers >= MAX_TEXTURE_IMAGE_UNITS (16) onto free
     * low texture units. The legacy model binds sampler register N to texture
     * unit N, but DX11/Carbon can assign sampler registers past the WebGL2
     * 16-unit limit - e.g. `Detail3Map` at `s16` once the tiled-light samplers
     * at s11-s13 are stubbed out. Such a register has no valid unit and its
     * `uniform1i` is never set (the s0-s15 setup loop above does not reach it),
     * so it defaults to unit 0 and collides with whatever samples unit 0
     * (GL_INVALID_OPERATION: two textures of different types share a sampler
     * location). Assign each out-of-range register the lowest unit in [0,16)
     * not already taken by an in-range sampler or an in-range volume slice, set
     * its `uniform1i`, and record the mapping on `program.carbonSamplerUnits` so
     * Tw2Effect binds the texture to the same unit at draw time. In-range
     * registers keep unit == register (no map entry), so shaders without an
     * out-of-range sampler are unaffected.
     * @param {Tw2ShaderProgram} program
     * @param {Tw2ShaderPass} pass
     * @param {WebGL2RenderingContext} gl
     */
    static SetupCarbonSamplerUnits(program, pass, gl)
    {
        const MAX_UNITS = Tw2ShaderProgram.GetMaxTextureImageUnits(gl);
        const remap = new Map();    // sampler registerIndex -> texture unit
        const occupied = Tw2ShaderProgram.OccupiedTextureUnits(pass, MAX_UNITS);

        // SetupCarbonResources runs first and allocates from the same low
        // range, so its units are already spoken for.
        for (const entry of program.carbonDataTextures || []) occupied.add(entry.unit);

        for (let s = 0; s < pass.stages.length; ++s)
        {
            for (const texture of pass.stages[s].textures || [])
            {
                const reg = texture.registerIndex;

                // Compare against the s# SETUP LOOP BOUND, not the driver limit.
                // `SetupGLSLShader` sets `s0`..`s15` and nothing above, so any
                // register at 16 or beyond has no uniform set whatever the
                // hardware reports - and an unset sampler uniform defaults to 0,
                // colliding with the samplerCube EnvMap that samples unit 0
                // (GL_INVALID_OPERATION, and the draw is DROPPED).
                //
                // This previously read `reg < MAX_UNITS`, which is the driver
                // value and is 32 on most desktop GPUs. There, registers 16-18
                // fell in a gap: too high for the setup loop, too low to be
                // remapped. The collision therefore appeared or vanished with the
                // GPU, which is exactly how it evaded being pinned down.
                if (reg < SAMPLER_SETUP_UNITS || remap.has(reg)) continue;

                let unit = 0;
                while (unit < MAX_UNITS && occupied.has(unit)) unit++;
                if (unit >= MAX_UNITS) continue; // over the unit budget; nothing free

                occupied.add(unit);
                remap.set(reg, unit);
                const location = gl.getUniformLocation(program.program, texture._glslSymbol || ("s" + reg));
                if (location) gl.uniform1i(location, unit);
            }
        }

        program.carbonSamplerUnits = remap.size ? remap : null;
    }

    /**
     * Resolves a Carbon pass's non-sampler bindings against the linked
     * program: structured UBOs (bones) get uniform-block binding points,
     * structured/buffer data textures (sb#/bt#) get texture units above
     * the legacy s0-15/vs0-15 range. The results are consumed at draw
     * time by Tw2CarbonResourceBinder.ApplyPass.
     * @param {Tw2ShaderProgram} program
     * @param {Tw2ShaderPass} pass
     * @param {WebGL2RenderingContext} gl
     */
    /**
     * Reads the per-fragment-stage sampler limit.
     *
     * This is the ceiling a sampler uniform's value must stay under. It is NOT
     * MAX_COMBINED_TEXTURE_IMAGE_UNITS, which only bounds how many units may be
     * bound across every stage at once.
     * @param {WebGL2RenderingContext} gl
     * @returns {Number}
     */
    static GetMaxTextureImageUnits(gl)
    {
        const value = typeof gl.getParameter === "function"
            ? gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
            : 0;

        return value > 0 ? value : 16;
    }

    /**
     * Collects the texture units a pass's ordinary samplers already claim.
     *
     * Regular samplers keep unit == registerIndex and volume samplers sit at
     * registerIndex + 12, both matching the s#/vs# loops in SetupGLSLShader.
     * @param {Tw2ShaderPass} pass
     * @param {Number} maxUnits
     * @returns {Set<Number>}
     */
    static OccupiedTextureUnits(pass, maxUnits)
    {
        const occupied = new Set();

        for (let s = 0; s < pass.stages.length; ++s)
        {
            for (const texture of pass.stages[s].textures || [])
            {
                if (texture.registerIndex < maxUnits) occupied.add(texture.registerIndex);
            }
            for (const sampler of pass.stages[s].samplers || [])
            {
                if (sampler.isVolume && sampler.registerIndex + 12 < maxUnits)
                {
                    occupied.add(sampler.registerIndex + 12);
                }
            }
        }

        return occupied;
    }

    static SetupCarbonResources(program, pass, gl)
    {
        program.carbonUniformBlocks = [];
        program.carbonDataTextures = [];

        const seen = new Set();
        let bindingPoint = 0;

        // A fragment sampler uniform may only name a unit below
        // MAX_TEXTURE_IMAGE_UNITS, which is 16 on plenty of hardware.
        // MAX_COMBINED_TEXTURE_IMAGE_UNITS (32) governs how many units may be
        // BOUND across all stages, not which ones a sampler can address - so
        // binding a data texture high and pointing the sampler at it raises no
        // error anywhere, and the shader silently reads zero. Allocate these
        // out of the same low range every other sampler uses.
        const maxUnits = Tw2ShaderProgram.GetMaxTextureImageUnits(gl);
        const occupied = Tw2ShaderProgram.OccupiedTextureUnits(pass, maxUnits);
        // Allocate DOWNWARD from the ceiling. Texture bindings are global GL
        // state shared by every program, while ordinary material samplers take
        // unit == registerIndex counting up from zero. Handing a data texture a
        // low unit therefore parks it exactly where some other shader's albedo
        // or roughness map lives, and whichever binds last wins - the hull then
        // samples the light buffer as if it were a material map. Starting at
        // the top keeps them clear of the range materials actually use.
        const nextFreeUnit = () =>
        {
            for (let candidate = maxUnits - 1; candidate >= 0; --candidate)
            {
                if (!occupied.has(candidate)) return candidate;
            }
            return -1;
        };

        for (let s = 0; s < pass.stages.length; ++s)
        {
            const bindings = pass.stages[s].carbonBindings;
            if (!bindings) continue;

            for (let i = 0; i < bindings.length; ++i)
            {
                const binding = bindings[i];
                const key = `${binding.kind}:${binding.name}`;
                if (seen.has(key)) continue;

                // The emulated-addressing buffer is an ordinary constantBuffer
                // binding with no marker field. It cannot carry one: `cjsSemantic`
                // is reserved vocabulary for the local-light family and the block
                // writer throws on any other value, and the wire drops fields it
                // does not encode — so an invented marker would vanish for every
                // effect loaded from bytes, which is exactly how the packed-light
                // branch came to be silently dead.
                //
                // It is identified by register instead. Carbon declares only
                // cb0-4, 6 and 7 across all 537 shipped effects, so a constant
                // buffer at 8 or above is the emitter's. Reading the register off
                // the binding rather than hardcoding 8 keeps this working if the
                // emitter's default ever moves.
                if (binding.kind === "constantBuffer" && binding.registerIndex > CARBON_LAST_CB_REGISTER)
                {
                    program.emulatedAddressingRegister = binding.registerIndex;
                    seen.add(key);
                    continue;
                }

                if (binding.kind === "structuredUbo")
                {
                    const blockIndex = gl.getUniformBlockIndex(program.program, binding.name + "Block");
                    if (blockIndex === gl.INVALID_INDEX) continue;
                    seen.add(key);
                    gl.uniformBlockBinding(program.program, blockIndex, bindingPoint);
                    program.carbonUniformBlocks.push({
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

                    const unit = nextFreeUnit();
                    if (unit < 0)
                    {
                        // eslint-disable-next-line no-console
                        console.warn(`Tw2ShaderProgram: no free texture unit for ${binding.name} (limit ${maxUnits}); it will read zero`);
                        continue;
                    }

                    seen.add(key);
                    occupied.add(unit);
                    gl.uniform1i(location, unit);
                    program.carbonDataTextures.push({
                        name: binding.name,
                        kind: binding.kind,
                        unit,
                        registerIndex: binding.registerIndex,
                        strideBytes: binding.strideBytes || 0,
                        width: binding.width || 0,
                        // Two spellings of the same fact. The emitter names the
                        // lowering `cjsSemantic` in memory, but the container
                        // wire format deliberately does not carry that name -
                        // it writes `localLightRole` with its own vocabulary
                        // ("packed-texture", not "packedLocalLights"). Anything
                        // loaded from bytes therefore only ever has the latter,
                        // so both must survive to the binder.
                        cjsSemantic: binding.cjsSemantic || null,
                        localLightRole: binding.localLightRole || null,
                        dataTexelBase: binding.dataTexelBase || 0
                    });
                }
            }
        }
    }
}
