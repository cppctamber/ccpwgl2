import { tw2 } from "global";
import { Tw2Effect } from "../../core/mesh/Tw2Effect";
import { Tw2EffectRes } from "../../core/resource/Tw2EffectRes";
import { Tw2GpuParticleState } from "./Tw2GpuParticleState";
import { Tw2GpuParticleEmitPass } from "./Tw2GpuParticleEmitPass";
import { Tw2GpuParticleDrawShader } from "./shaders/particleDraw";


/**
 * One GPU particle system, end to end: state, emission, simulation and draw.
 *
 * ## Why this is a singleton
 *
 * Not a convenience. The shipped data says so: the whole resource index holds
 * exactly ONE `Tr2GpuParticleSystem`, at `res:/fisfx/gpuparticles/system.black`,
 * and no asset carries its own. A quarter of sampled `res:/fisfx/**` effects
 * carry a `Tr2GpuUniqueEmitter` whose `EveChildParticleSystem` host has an EMPTY
 * `particleSystems` list - so an emitter has nothing local to emit into and must
 * reach a shared one.
 *
 * Carbon hangs that system off the SCENE (`EveSpaceScene_Blue.cpp:473`) and
 * reaches emitters through the update context. ccpwgl has no update context to
 * thread, and threading one through every `Update(dt)` in the engine to deliver
 * a single global object would be a large change to express a fact the data
 * already fixes: there is one system.
 *
 * So it lives here, reached by a static. The cost is honest and worth stating:
 * two scenes cannot have separate particle systems. Nothing in the shipped data
 * asks for that, and the day something does, this becomes a member of the scene
 * and the emitters get their context.
 *
 * ## What a frame does
 *
 * ```
 *   Update(dt)   simulate -> swap -> expand the frame's emit requests
 *   Render()     one draw, every particle, no vertex buffer
 * ```
 *
 * Emission runs AFTER the swap so new particles land in the side the next step
 * reads. Emitting before it has the step's own output overwrite every one of
 * them, silently.
 */
export class Tw2GpuParticleRenderer
{

    /** @type {Tw2GpuParticleState} */
    state = new Tw2GpuParticleState();

    /** @type {Tw2GpuParticleEmitPass} */
    emitPass = new Tw2GpuParticleEmitPass();

    /** @type {?Tw2Effect} */
    updateEffect = null;

    /** @type {?Tw2Effect} */
    drawEffect = null;

    /**
     * The system emitters hand their batches to.
     * @type {?Tr2GpuParticleSystem}
     */
    system = null;

    /**
     * Seconds since this renderer started, which drives turbulence. Its own
     * clock rather than the device's, so a system created mid-session does not
     * begin by sampling the noise volume at an arbitrary offset.
     * @type {Number}
     */
    time = 0;

    /**
     * The gravity axis. A world convention rather than an emitter's property -
     * Carbon stores gravity as a scalar and applies it downward.
     * @type {Array<Number>}
     */
    gravityAxis = [ 0, -1, 0 ];

    /**
     * Zero until the atlas has loaded, which makes the draw fall back to a
     * procedural dot rather than sampling an unloaded texture and drawing
     * nothing.
     * @type {Number}
     * @private
     */
    _atlasTiles = 0;

    /** @type {Boolean} @private */
    _failed = false;

    /**
     * Builds everything. Safe to call more than once.
     * @param {Number} [capacity=65536]
     * @returns {Tw2GpuParticleRenderer}
     */
    Create(capacity = Tw2GpuParticleRenderer.CAPACITY)
    {
        if (this.updateEffect || this._failed) return this;

        const device = tw2.device;

        // WEBGL1 GETS NOTHING, deliberately. The shaders are GLSL ES 3.00 and
        // the state is float render targets; there is no fallback worth having,
        // and the shipped gles2 precursor never worked on that target either.
        if (device.glVersion < 2 || !device.canRenderToFloat)
        {
            this._failed = true;
            tw2.Warning({
                name: "GPU particles",
                description: "WebGL2 with EXT_color_buffer_float is required - GPU particles are disabled"
            });
            return this;
        }

        if (!this.state.Create(capacity))
        {
            this._failed = true;
            return this;
        }

        this.emitPass.Create(Tw2GpuParticleRenderer.EMITTERS);

        this.updateEffect = Tw2GpuParticleRenderer.CreateEffect("tw2particleupdate");
        this.drawEffect = Tw2GpuParticleRenderer.CreateEffect("tw2particledraw");

        // Bound by path and not awaited. Both have a defined behaviour while
        // they load - see _atlasTiles - so a slow texture delays the sprites
        // rather than the system.
        Tw2GpuParticleRenderer.SetTexture(this.updateEffect, "ParticleNoiseMap", Tw2GpuParticleRenderer.NOISE);
        Tw2GpuParticleRenderer.SetTexture(this.drawEffect, "ParticleAtlasMap", Tw2GpuParticleDrawShader.ATLAS.path);

        const system = tw2.GetClass("Tr2GpuParticleSystem");
        if (system) this.system = new system();

        return this;
    }

    /**
     * Whether a frame can actually be run.
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(
            !this._failed &&
            this.state.IsGood() &&
            this.emitPass.IsGood() &&
            this.updateEffect && this.updateEffect.IsGood() &&
            this.drawEffect && this.drawEffect.IsGood()
        );
    }

    /**
     * The arguments an emitter needs to find this system.
     *
     * @param {Object} out - reused by the caller; nothing is retained here
     * @param {mat4} parentTransform
     * @returns {Object} out
     */
    GetEmitArguments(out, parentTransform)
    {
        out.system = this.system;
        out.time = this.time;
        out.parentTransform = parentTransform;
        return out;
    }

    /**
     * Advances one frame: simulate, swap, then expand what the emitters asked
     * for.
     *
     * @param {Number} dt
     * @returns {Tw2GpuParticleRenderer}
     */
    Update(dt)
    {
        if (!this.IsGood()) return this;

        // The same clamp the emitter bills at, and for the same reason: a
        // stalled tab must not advance the simulation by a whole second. Kept
        // in one place so the two cannot disagree.
        dt = Math.min(Math.max(dt, 0), Tw2GpuParticleRenderer.MAXIMUM_FRAME_TIME);
        this.time += dt;

        if (dt > 0)
        {
            const
                device = tw2.device,
                effect = this.updateEffect,
                front = this.state.GetFront(),
                rows = this.emitPass.params.capacity;

            Tw2GpuParticleEmitPass.SetParameter(effect, "ParticleTime", [ dt, this.time, 0, 0 ]);
            Tw2GpuParticleEmitPass.SetParameter(effect, "ParticleWorld", [
                this.gravityAxis[0], this.gravityAxis[1], this.gravityAxis[2], rows
            ]);
            Tw2GpuParticleEmitPass.SetParameter(effect, "ParticleNoise", [ 0, 0, 0, 0 ]);

            Tw2GpuParticleRenderer.AttachTexture(effect, "ParticlePositionMap", front.position);
            Tw2GpuParticleRenderer.AttachTexture(effect, "ParticleVelocityMap", front.velocity);
            Tw2GpuParticleRenderer.AttachTexture(effect, "ParticleAttributeMap", front.attributes);
            Tw2GpuParticleRenderer.AttachTexture(effect, "ParticleParamsMap", this.emitPass.params.texture);

            this.state.GetBack().SetCallUnset(() => device.RenderFullScreenQuad(effect));
            this.state.Swap();
        }

        this.emitPass.EmitRequests(this.system, this.state);
        return this;
    }

    /**
     * Draws every particle in one call.
     * @returns {Tw2GpuParticleRenderer}
     */
    Render()
    {
        if (!this.IsGood()) return this;

        const
            device = tw2.device,
            gl = device.gl,
            effect = this.drawEffect,
            front = this.state.GetFront();

        if (!this._atlasTiles)
        {
            const res = tw2.GetResource(Tw2GpuParticleDrawShader.ATLAS.path);
            if (res && res.IsGood() && res._width) this._atlasTiles = Tw2GpuParticleDrawShader.ATLAS.tiles;
        }

        Tw2GpuParticleEmitPass.SetParameter(effect, "ParticleDrawData", [ this.state.width, this.state.height, 1, 0 ]);
        Tw2GpuParticleEmitPass.SetParameter(effect, "ParticleTable", [ this.emitPass.params.capacity, this._atlasTiles, 0, 0 ]);

        Tw2GpuParticleRenderer.AttachTexture(effect, "ParticlePositionMap", front.position);
        Tw2GpuParticleRenderer.AttachTexture(effect, "ParticleVelocityMap", front.velocity);
        Tw2GpuParticleRenderer.AttachTexture(effect, "ParticleAttributeMap", front.attributes);
        Tw2GpuParticleRenderer.AttachTexture(effect, "ParticleParamsMap", this.emitPass.params.texture);

        const count = effect.GetPassCount("Main");

        for (let pass = 0; pass < count; pass++)
        {
            effect.ApplyPass("Main", pass);

            // EVERY ATTRIBUTE ARRAY OFF. Whatever drew last leaves its arrays
            // enabled, and this draw asks for six vertices per particle with no
            // buffer bound - sourcing those from a previous draw's buffer is an
            // out of range access, not a no-op.
            const max = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
            for (let i = 0; i < max; i++) gl.disableVertexAttribArray(i);

            gl.drawArrays(gl.TRIANGLES, 0, this.state.capacity * Tw2GpuParticleDrawShader.VERTICES_PER_PARTICLE);
        }

        return this;
    }

    /**
     * Releases everything.
     * @returns {Tw2GpuParticleRenderer}
     */
    Destroy()
    {
        this.state.Destroy();
        this.emitPass.Destroy();
        this.updateEffect = null;
        this.drawEffect = null;
        this.system = null;
        this._atlasTiles = 0;
        this._failed = false;
        return this;
    }

    /**
     * The one renderer, built on first use.
     *
     * See the class header for why there is only one - it is what the shipped
     * data describes, not a shortcut.
     *
     * @returns {Tw2GpuParticleRenderer}
     */
    static Get()
    {
        if (!Tw2GpuParticleRenderer._instance)
        {
            Tw2GpuParticleRenderer._instance = new Tw2GpuParticleRenderer();
        }

        return Tw2GpuParticleRenderer._instance.Create();
    }

    /**
     * Whether a renderer exists AND can run, without building one.
     *
     * A caller in a per-frame path wants this rather than `Get`, so a scene
     * with no GPU particles in it never allocates megabytes of float targets.
     * @returns {Boolean}
     */
    static IsActive()
    {
        const it = Tw2GpuParticleRenderer._instance;
        return !!(it && it.IsGood());
    }

    /**
     * Builds an effect around a manual shader.
     * @param {String} name
     * @returns {Tw2Effect}
     */
    static CreateEffect(name)
    {
        const effectFilePath = `manual:/${name}.sm_json`;
        if (!tw2.resMan.motherLode.Has(effectFilePath)) Tw2EffectRes.fromManual(name);

        return Tw2Effect.from({ name, effectFilePath, autoParameter: true });
    }

    /**
     * Sets a texture parameter by path, if the effect has it.
     * @param {Tw2Effect} effect
     * @param {String} name
     * @param {String} path
     * @returns {Boolean}
     */
    static SetTexture(effect, name, path)
    {
        const parameter = effect && effect.parameters ? effect.parameters[name] : null;
        if (!parameter || !parameter.SetValue) return false;
        parameter.SetValue(path);
        return true;
    }

    /**
     * Attaches an already-built texture resource to a parameter.
     * @param {Tw2Effect} effect
     * @param {String} name
     * @param {Tw2TextureRes} res
     * @returns {Boolean}
     */
    static AttachTexture(effect, name, res)
    {
        const parameter = effect && effect.parameters ? effect.parameters[name] : null;
        if (!parameter || !parameter.AttachTextureRes || !res) return false;
        parameter.AttachTextureRes(res);
        return true;
    }

    /**
     * @type {?Tw2GpuParticleRenderer}
     * @private
     */
    static _instance = null;

    /**
     * Particles the system can hold at once.
     *
     * Carbon's shipped system says 1,048,576, which at three rgba32f textures
     * per side and two sides is 100MB of state. This is a starting figure that
     * a caller can raise, not a claim about what Carbon budgets.
     * @type {Number}
     */
    static CAPACITY = 65536;

    /**
     * Distinct emitters the parameter table holds.
     * @type {Number}
     */
    static EMITTERS = 64;

    /**
     * A frame longer than this is billed as this - the same figure the emitter
     * clamps at, and it has to be, or the two disagree about how much time
     * passed.
     * @type {Number}
     */
    static MAXIMUM_FRAME_TIME = 1 / 15;

    /**
     * Carbon's turbulence volume, as the shipped system binds it.
     * @type {String}
     */
    static NOISE = "res:/texture/global/noise32cube_volume.dds";

}
